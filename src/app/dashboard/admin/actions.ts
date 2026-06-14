'use server';

import { createClient } from '@/lib/supabase/server';
import type { AdminCourse } from '@/types/course';
import type { OrgUser } from '@/types/user';

type OrgUserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  status: 'active' | 'suspended';
  created_at: string;
};

type OrganizationInfo = {
  id: string;
  name: string;
  status: string;
  plan: string | null;
  max_students: number | null;
};

type OrganizationDomain = {
  id: string;
  domain: string;
  role_hint: string | null;
};

type CourseWithRelations = {
  id: string;
  code: string;
  name: string;
  term: string;
  year: number;
  status: string;
  section: string | null;
  profiles: { full_name: string | null } | { full_name: string | null }[] | null;
  course_enrollments: { count: number }[] | null;
};

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

export async function getOrgUsers(): Promise<{ data: OrgUser[]; error?: string }> {
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
  const { data: users, error: usersError } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, metadata, created_at')
    .eq('organization_id', orgId)
    .order('role', { ascending: true })
    .order('full_name', { ascending: true });

  if (usersError) {
    return { error: usersError.message, data: [] };
  }

  const formattedUsers: OrgUser[] = (users ?? []).map((user: OrgUserRow) => ({
    id: user.id,
    full_name: user.full_name ?? 'Bilinmiyor',
    email: user.email ?? '',
    role: user.role,
    status: user.metadata?.status === 'suspended' ? 'suspended' : 'active',
    created_at: user.created_at,
  }));

  return { data: formattedUsers };
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
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', userId);

  if (updateError) {
    return { error: 'Kullanıcı rolü güncellenirken bir hata oluştu.' };
  }

  return { success: true };
}

export async function updateOrgUserStatus(userId: string, status: 'active' | 'suspended'): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Oturum bulunamadı' };

  // Super admin veya Admin kontrolü yap
  const { data: adminProfile } = await supabase
    .from('profiles')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (!adminProfile || (adminProfile.role !== 'admin' && adminProfile.role !== 'super_admin')) {
    return { error: 'Bu işlem için yetkiniz yok.' };
  }

  // Kullanıcının organizasyonunu kontrol et
  const { data: targetUser } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', userId)
    .single();

  if (!targetUser || targetUser.organization_id !== adminProfile.organization_id) {
    return { error: 'Bu kullanıcıyı düzenleme yetkiniz yok.' };
  }

  const newMetadata = { ...(targetUser.metadata || {}), status };

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ metadata: newMetadata })
    .eq('id', userId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}

export async function getOrgSettings(): Promise<
  | { organization: OrganizationInfo; domains: OrganizationDomain[] }
  | { error: string }
> {
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
    .select('id, name, status, plan, max_students')
    .eq('id', orgId)
    .single<OrganizationInfo>();

  if (orgError || !organization) return { error: orgError?.message ?? 'Organizasyon bilgileri alınamadı' };

  // 3. Organizasyona ait domainleri getir
  const { data: domains, error: domainsError } = await supabase
    .from('organization_domains')
    .select('id, domain, role_hint')
    .eq('organization_id', orgId);

  if (domainsError) return { error: domainsError.message };

  return { organization, domains: (domains ?? []) as OrganizationDomain[] };
}

export async function getOrgCourses(): Promise<{ data: AdminCourse[]; error?: string }> {
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
      section,
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

  const typedCourses = (courses ?? []) as CourseWithRelations[];

  const formattedCourses: AdminCourse[] = typedCourses.map((course) => {
    const instructorProfile = Array.isArray(course.profiles) ? course.profiles[0] : course.profiles;
    return {
      id: course.id,
      code: course.code,
      name: course.name,
      term: course.term,
      year: course.year,
      section: course.section,
      status: course.status,
      instructorName: instructorProfile?.full_name ?? 'Bilinmiyor',
      studentCount: course.course_enrollments?.[0]?.count ?? 0,
    } satisfies AdminCourse;
  });

  return { data: formattedCourses };
}
