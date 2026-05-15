'use server';

import { createClient } from '@/lib/supabase/server';

export async function getStudentStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data: enrollments, error } = await supabase
    .from('course_enrollments')
    .select('id, status, courses(id, name, code, status)')
    .eq('student_id', user.id);

  if (error) return { error: error.message };

  const activeCount = enrollments?.filter(e => (e.courses as any)?.status === 'active').length || 0;

  return {
    stats: {
      enrolledCourses: enrollments?.length || 0,
      activeCourses: activeCount,
      teams: 0, // ileride takımlar tablosundan çekilecek
    }
  };
}

export async function getStudentCourses() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı', data: [] };

  const { data, error } = await supabase.rpc('get_my_enrolled_courses');

  if (error) return { error: error.message, data: [] };

  const courses = (data || []).map((row: any) => ({
    enrollmentId:     row.enrollment_id,
    enrollmentStatus: row.enrollment_status,
    enrolledAt:       row.enrolled_at,
    id:               row.course_id,
    code:             row.code,
    name:             row.name,
    term:             row.term,
    year:             row.year,
    section:          row.section,
    status:           row.course_status,
    joinCode:         row.join_code,
    instructorName:   row.instructor_name || 'Bilinmiyor',
  }));

  return { data: courses };
}

export async function joinCourseByCode(joinCode: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  // Katılım koduna sahip aktif dersi bul (RPC ile RLS bypass)
  const { data: courseId, error: rpcError } = await supabase
    .rpc('get_course_by_join_code', { p_join_code: joinCode.trim().toUpperCase() });

  if (rpcError || !courseId) {
    return { error: 'Geçersiz veya süresi dolmuş katılım kodu.' };
  }

  // Zaten kayıtlı mı kontrol et
  const { data: existing } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('course_id', courseId)
    .eq('student_id', user.id)
    .single();

  if (existing) return { error: 'Bu derse zaten kayıtlısınız.' };

  // Kaydı oluştur
  const { error } = await supabase
    .from('course_enrollments')
    .insert({ course_id: courseId, student_id: user.id, status: 'enrolled' });

  if (error) return { error: error.message };
  return { success: true };
}
