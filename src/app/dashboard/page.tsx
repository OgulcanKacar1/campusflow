import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Oturum kontrolü
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('[Dashboard] user:', user?.id ?? 'NULL', '| error:', userError?.message ?? 'none');

  if (!user) {
    console.log('[Dashboard] → No user, redirecting to /login');
    redirect('/login');
  }

  // Kullanıcının profilini ve rolünü çek
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  console.log('[Dashboard] profile:', profile?.role ?? 'NULL', '| error:', profileError?.message ?? 'none');

  if (!profile) {
    // Profil yoksa, oturumu kapat ki middleware tekrar dashboard'a yönlendirmesin (sonsuz döngü engeli)
    console.log('[Dashboard] → No profile, signing out and redirecting to /login');
    await supabase.auth.signOut();
    redirect('/login');
  }

  // Role göre yönlendir
  switch (profile.role) {
    case 'super_admin':
      redirect('/dashboard/super-admin');
    case 'admin':
      redirect('/dashboard/admin');
    case 'instructor':
      redirect('/dashboard/instructor');
    case 'student':
      redirect('/dashboard/student');
    default:
      redirect('/login');
  }
}
