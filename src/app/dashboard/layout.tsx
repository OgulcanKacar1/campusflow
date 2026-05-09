import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Oturum kontrolü
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // Profil bilgilerini ve bağlı olduğu okulu çek
  const { data: profile } = await supabase
    .from('profiles')
    .select(`
      role, 
      full_name, 
      email,
      organizations ( name )
    `)
    .eq('id', user.id)
    .single();

  const orgName = (profile?.organizations as any)?.name || null;

  if (!profile) {
    await supabase.auth.signOut();
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-[#060b18] overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        role={profile.role}
        fullName={profile.full_name}
        email={profile.email}
        orgName={orgName}
      />

      {/* Ana İçerik */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
