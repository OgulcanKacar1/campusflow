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

  return {
    organization,
    stats: {
      students: studentCount || 0,
      instructors: instructorCount || 0,
      activeCourses: 0, // İleride ders tablosu eklenince burası dolacak
    }
  };
}
