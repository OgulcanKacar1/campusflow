'use server';

import { createClient } from '@/lib/supabase/server';

export async function getInstructorStats() {
  const supabase = await createClient();

  // 1. Hocanın bilgilerini bul
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return { error: 'Organizasyon bulunamadı' };

  // 2. Hocanın verdiği dersleri çek
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, status, course_enrollments(count)')
    .eq('instructor_id', user.id)
    .eq('organization_id', profile.organization_id);

  if (error) {
    return { error: error.message };
  }

  const activeCoursesCount = courses?.filter(c => c.status === 'active').length || 0;
  
  // Toplam öğrenci sayısını (derslerdeki unique veya toplam enrollement) hesapla
  // Şimdilik enrollments count'ları topluyoruz.
  const totalStudents = courses?.reduce((sum, course) => {
    const enrollmentsCount = (course.course_enrollments as any)?.[0]?.count || 0;
    return sum + enrollmentsCount;
  }, 0) || 0;

  return {
    stats: {
      activeCourses: activeCoursesCount,
      totalStudents,
      upcomingTasks: 0, // İleride tasks tablosundan çekilecek
    }
  };
}

export async function getInstructorCourses() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı', data: [] };

  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      code,
      name,
      term,
      year,
      section,
      status,
      join_code,
      course_enrollments ( count )
    `)
    .eq('instructor_id', user.id)
    .order('year', { ascending: false })
    .order('term', { ascending: false })
    .order('code', { ascending: true });

  if (error) {
    return { error: error.message, data: [] };
  }

  const formattedCourses = courses?.map(c => ({
    id: c.id,
    code: c.code,
    name: c.name,
    term: c.term,
    year: c.year,
    section: c.section,
    status: c.status,
    joinCode: c.join_code,
    studentCount: (c.course_enrollments as any)?.[0]?.count || 0
  })) || [];

  return { data: formattedCourses };
}

export async function createCourse(formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) return { error: 'Organizasyon bulunamadı' };

  const code = formData.get('code') as string;
  const name = formData.get('name') as string;
  const term = formData.get('term') as string;
  const year = parseInt(formData.get('year') as string);
  const section = formData.get('section') as string;

  if (!code || !name || !term || !year) {
    return { error: 'Lütfen zorunlu alanları doldurun.' };
  }

  // Geçmiş tarihli ders ekleme engeli
  const currentYear = new Date().getFullYear();
  if (year < currentYear) {
    return { error: `Geçmiş yıllar (${year}) için ders oluşturulamaz.` };
  }

  // Rastgele 6 haneli alfa-nümerik katılım kodu üret
  const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const { error } = await supabase
    .from('courses')
    .insert({
      organization_id: profile.organization_id,
      instructor_id: user.id,
      code,
      name,
      term,
      year,
      section: section || null,
      join_code: joinCode,
    });

  if (error) {
    // Unique kısıtlama hatası
    if (error.code === '23505') {
      return { error: 'Bu ders kodu, yıl, dönem ve şube kombinasyonu zaten mevcut.' };
    }
    return { error: error.message };
  }

  return { success: true };
}

export async function updateCourse(courseId: string, formData: FormData) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const code = formData.get('code') as string;
  const name = formData.get('name') as string;
  const term = formData.get('term') as string;
  const year = parseInt(formData.get('year') as string);
  const section = formData.get('section') as string;
  const status = formData.get('status') as string;

  if (!code || !name || !term || !year) {
    return { error: 'Lütfen zorunlu alanları doldurun.' };
  }

  const { error } = await supabase
    .from('courses')
    .update({
      code,
      name,
      term,
      year,
      section: section || null,
      status: status as any,
    })
    .eq('id', courseId)
    .eq('instructor_id', user.id); // Sadece kendi dersini güncelleyebilir

  if (error) return { error: error.message };
  return { success: true };
}

export async function deleteCourse(courseId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  // Soft delete (status = 'deleted') veya tamamen silme
  // Burada senin kararına göre tamamen siliyoruz (referanslar CASCADE olduğu için her şeyi temizler)
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)
    .eq('instructor_id', user.id);

  if (error) return { error: error.message };
  return { success: true };
}

export async function enrollStudentsFromCSV(courseId: string, csvContent: string) {
  const supabase = await createClient();

  const { data: { user: instructor } } = await supabase.auth.getUser();
  if (!instructor) return { error: 'Oturum bulunamadı' };

  // 1. Dersin bu hocaya ait olduğunu doğrula
  const { data: course } = await supabase
    .from('courses')
    .select('id')
    .eq('id', courseId)
    .eq('instructor_id', instructor.id)
    .single();

  if (!course) return { error: 'Ders bulunamadı veya yetkiniz yok.' };

  // 2. CSV'yi parse et (E-postaları ayıkla)
  // Basit bir regex veya split ile mailleri alıyoruz
  const emails = csvContent
    .split(/[\n,;]/)
    .map(email => email.trim().toLowerCase())
    .filter(email => email.includes('@') && email.includes('.'));

  if (emails.length === 0) return { error: 'Geçerli e-posta adresi bulunamadı.' };

  // 3. Sistemdeki kayıtlı profilleri bul
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', emails)
    .eq('role', 'student');

  const registeredEmails = profiles?.map(p => p.email) || [];
  const unregisteredEmails = emails.filter(email => !registeredEmails.includes(email));

  if (registeredEmails.length === 0) {
    return { 
      error: 'Girilen e-postalardan hiçbiri sistemde kayıtlı bir öğrenciye ait değil.',
      unregistered: emails 
    };
  }

  // 4. Kayıtları oluştur
  const enrollments = profiles!.map(p => ({
    course_id: courseId,
    student_id: p.id,
    status: 'enrolled'
  }));

  const { error: enrollError } = await supabase
    .from('course_enrollments')
    .upsert(enrollments, { onConflict: 'course_id, student_id' });

  if (enrollError) return { error: enrollError.message };

  return {
    success: true,
    enrolledCount: registeredEmails.length,
    unregistered: unregisteredEmails
  };
}
