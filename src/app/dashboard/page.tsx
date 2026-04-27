import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Oturum kontrolü
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Kullanıcının profilini ve rolünü çek
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
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
