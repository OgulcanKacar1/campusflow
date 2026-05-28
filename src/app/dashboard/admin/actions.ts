'use server';

import { createClient } from '@/lib/supabase/server';

export async function getAdminDashboardStats() {
  const supabase = await createClient();

  // 1. Kullanıcının kim olduğunu ve organizasyonunu bul
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) return { error: 'Organizasyon bulunamadı' };

  // 2. Okulun lisans ve plan bilgilerini getir
  const { data: organization } = await supabase
    .from('organizations')
    .select('name, plan, max_students')
    .eq('id', orgId)
    .single();

  // 3. Öğrenci sayısını hesapla
  const { count: studentCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('role', 'student');

  // 4. Hoca sayısını hesapla
  const { count: instructorCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('role', 'instructor');

  // 5. Aktif ders sayısını hesapla
  const { count: activeCourseCount } = await supabase
    .from('courses')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('status', 'active');

  return {
    organization,
    stats: {
      students: studentCount || 0,
      instructors: instructorCount || 0,
      activeCourses: activeCourseCount || 0,
    }
  };
}

export async function getOrgUsers() {
  const supabase = await createClient();

  // 1. Adminin kendi organizasyonunu bul
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı', data: [] };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) return { error: 'Organizasyon bulunamadı', data: [] };

  // 2. Kendi organizasyonundaki diğer kullanıcıları getir
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, created_at')
    .eq('organization_id', orgId)
    // .neq('id', user.id) // Kendisini de görebilir, sorun değil
    .order('role', { ascending: true })
    .order('full_name', { ascending: true });

  if (error) {
    return { error: error.message, data: [] };
  }

  return { data: data ?? [] };
}

export async function updateOrgUserRole(userId: string, newRole: 'student' | 'instructor') {
  const supabase = await createClient();

  // Güvenlik: Admin sadece öğrenci ve hoca rollerini atayabilir. Kendisini veya başkasını super_admin veya admin yapamaz (super_admin yapar).
  if (newRole !== 'student' && newRole !== 'instructor') {
    return { error: 'Geçersiz rol.' };
  }

  // 1. Adminin organizasyonunu bul
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Yetkisiz erişim.' };

  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const orgId = adminProfile?.organization_id;
  if (!orgId) return { error: 'Organizasyon yetkisi bulunamadı.' };

  // 2. Güncellenmek istenen kullanıcının aynı organizasyonda olduğunu doğrula
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('organization_id, role')
    .eq('id', userId)
    .single();

  if (!targetProfile || targetProfile.organization_id !== orgId) {
    return { error: 'Bu kullanıcıyı düzenleme yetkiniz yok.' };
  }

  if (targetProfile.role === 'super_admin' || targetProfile.role === 'admin') {
    return { error: 'Admin veya Super Admin rollerini değiştiremezsiniz.' };
  }

  // 3. Güncellemeyi yap
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function getOrgSettings() {
  const supabase = await createClient();

  // 1. Adminin organizasyonunu bul
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) return { error: 'Organizasyon bulunamadı' };

  // 2. Organizasyon bilgilerini getir
  const { data: organization, error: orgError } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', orgId)
    .single();

  if (orgError) return { error: orgError.message };

  // 3. Organizasyona ait domainleri getir
  const { data: domains, error: domainsError } = await supabase
    .from('organization_domains')
    .select('*')
    .eq('organization_id', orgId);

  if (domainsError) return { error: domainsError.message };

  return { organization, domains };
}

export async function getOrgCourses() {
  const supabase = await createClient();

  // 1. Adminin organizasyonunu bul
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı', data: [] };

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const orgId = profile?.organization_id;
  if (!orgId) return { error: 'Organizasyon bulunamadı', data: [] };

  // 2. Okuldaki dersleri çek. 
  // Hocanın adını profiles'dan, öğrenci sayısını da course_enrollments'dan sayacağız.
  // Not: Supabase'de alt sorgu count'u almak için relations kullanılır.
  const { data: courses, error } = await supabase
    .from('courses')
    .select(`
      id,
      code,
      name,
      term,
      year,
      status,
      profiles!instructor_id ( full_name ),
      course_enrollments ( count )
    `)
    .eq('organization_id', orgId)
    .order('year', { ascending: false })
    .order('term', { ascending: false })
    .order('code', { ascending: true });

  if (error) {
    return { error: error.message, data: [] };
  }

  // Veriyi arayüzün beklediği formata maple
  const formattedCourses = courses?.map(c => ({
    id: c.id,
    code: c.code,
    name: c.name,
    term: c.term,
    year: c.year,
    status: c.status,
    instructorName: (c.profiles as any)?.full_name || 'Bilinmiyor',
    studentCount: (c.course_enrollments as any)?.[0]?.count || 0
  })) || [];

  return { data: formattedCourses };
}
