'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { InstructorCourse } from '@/types/course';
import type { CourseStudentSummary } from '@/types/instructor';

// Types
interface ActionResult<T = void> {
  data?: T;
  error?: string;
}

type CourseEnrollmentCount = { count: number | null };

type CourseStatsRow = {
  status: string;
  course_enrollments: CourseEnrollmentCount[] | null;
};

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

  const courseRows = (courses ?? []) as unknown as CourseStatsRow[];

  const activeCoursesCount = courseRows.filter((course) => course.status === 'active').length;

  const totalStudents = courseRows.reduce((sum, course) => {
    const enrollmentCount = course.course_enrollments?.[0]?.count ?? 0;
    return sum + enrollmentCount;
  }, 0);

  return {
    stats: {
      activeCourses: activeCoursesCount,
      totalStudents,
      upcomingTasks: 0, // İleride tasks tablosundan çekilecek
    }
  };
}

interface InstructorCourseRow {
  id: string;
  code: string;
  name: string;
  term: string;
  year: number;
  section: string | null;
  status: string;
  join_code: string | null;
  team_mode: 'instructor' | 'random' | 'student';
  team_min_size: number | null;
  team_max_size: number | null;
  course_enrollments: { count: number | null }[] | null;
}

export async function getInstructorCourses(): Promise<{ data: InstructorCourse[]; error?: string }> {
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
      team_mode,
      team_min_size,
      team_max_size,
      course_enrollments ( count )
    `)
    .eq('instructor_id', user.id)
    .neq('status', 'deleted')
    .order('year', { ascending: false })
    .order('term', { ascending: false })
    .order('code', { ascending: true });

  if (error) {
    return { error: error.message, data: [] };
  }

  const rows = (courses ?? []) as unknown as InstructorCourseRow[];

  const formattedCourses: InstructorCourse[] = rows.map((c) => ({
    id: c.id,
    code: c.code,
    name: c.name,
    term: c.term,
    year: c.year,
    section: c.section,
    status: c.status,
    joinCode: c.join_code,
    studentCount: c.course_enrollments?.[0]?.count ?? 0,
    teamMode: c.team_mode,
    teamMinSize: c.team_min_size,
    teamMaxSize: c.team_max_size,
  }));

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

  // Güvenli 6 haneli alfa-nümerik katılım kodu üret (crypto + retry)
  function generateJoinCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(crypto.getRandomValues(new Uint32Array(1))[0] % chars.length);
    }
    return result;
  }

  let joinCode: string;
  let attempts = 0;
  const maxAttempts = 5;

  do {
    joinCode = generateJoinCode();
    const { data: existing } = await supabase
      .from('courses')
      .select('id')
      .eq('join_code', joinCode)
      .single();
    
    if (!existing) break; // Unique code found
    attempts++;
  } while (attempts < maxAttempts);

  if (attempts >= maxAttempts) {
    return { error: 'Katılım kodu oluşturulamadı. Lütfen tekrar deneyin.' };
  }

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


export async function deleteCourse(courseId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  // Soft delete: sadece status = 'deleted' olarak işaretle
  // Veriler korunur, CASCADE ile veri kaybı olmaz
  const { error } = await supabase
    .from('courses')
    .update({ status: 'deleted' })
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

  // 4. Önce mevcut kayıtları say
  const { data: existingEnrollments } = await supabase
    .from('course_enrollments')
    .select('student_id')
    .eq('course_id', courseId)
    .in('student_id', profiles!.map(p => p.id));

  const existingStudentIds = existingEnrollments?.map(e => e.student_id) || [];
  const newStudents = profiles!.filter(p => !existingStudentIds.includes(p.id));

  // 5. Yeni kayıtları oluştur
  const enrollments = newStudents.map(p => ({
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
    enrolledCount: newStudents.length,
    alreadyEnrolled: existingStudentIds.length,
    unregistered: unregisteredEmails
  };
}

/**
 * Tek ders detayını getir
 */
export async function getCourseById(courseId: string): Promise<ActionResult<InstructorCourse>> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data: course, error } = await supabase
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
      team_mode,
      team_min_size,
      team_max_size,
      course_enrollments ( count )
    `)
    .eq('id', courseId)
    .eq('instructor_id', user.id)
    .single();

  if (error || !course) {
    return { error: 'Ders bulunamadı' };
  }

  const courseRow = (course ?? null) as unknown as InstructorCourseRow | null;

  if (!courseRow) {
    return { error: 'Ders bulunamadı' };
  }

  return {
    data: {
      id: courseRow.id,
      code: courseRow.code,
      name: courseRow.name,
      term: courseRow.term,
      year: courseRow.year,
      section: courseRow.section,
      status: courseRow.status,
      joinCode: courseRow.join_code,
      studentCount: courseRow.course_enrollments?.[0]?.count ?? 0,
      teamMode: courseRow.team_mode ?? 'instructor',
      teamMinSize: courseRow.team_min_size ?? null,
      teamMaxSize: courseRow.team_max_size ?? null,
    }
  };
}

interface UpdateCourseInput {
  courseId: string;
  name?: string;
  code?: string;
  section?: string;
  teamMode?: 'instructor' | 'random' | 'student';
  minTeamSize?: number;
  maxTeamSize?: number;
}

type CourseEnrollmentRow = {
  student_id: string;
  created_at: string;
  profiles: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
};

type TeamMemberRow = {
  student_id: string;
  team_id: string | null;
  teams: { name: string | null } | null;
};

export async function getCourseStudents(courseId: string): Promise<ActionResult<CourseStudentSummary[]>> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  // 1. Öğrencileri çek
  const { data: enrollments, error } = await supabase
    .from('course_enrollments')
    .select(`
      student_id,
      created_at,
      profiles:student_id (id, full_name, email)
    `)
    .eq('course_id', courseId)
    .eq('status', 'enrolled');

  if (error) {
    return { error: error.message };
  }

  // 2. Her öğrencinin takım bilgisini ayrı çek
  const enrollmentRows = (enrollments ?? []) as unknown as CourseEnrollmentRow[];
  const studentIds = enrollmentRows.map((e) => e.student_id);

  let teamMembers: TeamMemberRow[] = [];
  if (studentIds.length > 0) {
    const { data: tmData } = await supabase
      .from('team_members')
      .select('student_id, team_id, teams(name)')
      .in('student_id', studentIds);
    teamMembers = (tmData ?? []) as unknown as TeamMemberRow[];
  }

  // 3. Takım bilgisini eşleştir
  const students: CourseStudentSummary[] = enrollmentRows.map((enrollment) => {
    const teamMember = teamMembers.find((tm) => tm.student_id === enrollment.student_id);
    return {
      id: enrollment.student_id,
      name: enrollment.profiles?.full_name ?? 'İsimsiz',
      email: enrollment.profiles?.email ?? '',
      team: teamMember?.teams?.name ?? '-',
      date: new Date(enrollment.created_at).toLocaleDateString('tr-TR'),
    } satisfies CourseStudentSummary;
  });

  return { data: students };
}

export async function updateCourse(input: UpdateCourseInput): Promise<ActionResult> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.code !== undefined) updateData.code = input.code;
  if (input.section !== undefined) updateData.section = input.section;
  if (input.teamMode !== undefined) updateData.team_mode = input.teamMode;
  if (input.minTeamSize !== undefined) updateData.team_min_size = input.minTeamSize;
  if (input.maxTeamSize !== undefined) updateData.team_max_size = input.maxTeamSize;

  const { error } = await supabase
    .from('courses')
    .update(updateData)
    .eq('id', input.courseId)
    .eq('instructor_id', user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/dashboard/instructor/courses/${input.courseId}`);
  return {};
}
