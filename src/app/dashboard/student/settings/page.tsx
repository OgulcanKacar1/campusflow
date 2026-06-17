import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';
import { ProfileSettingsClient } from '../../_shared/settings/ProfileSettingsClient';

export default async function StudentSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <DashboardBreadcrumb items={[{ label: 'Ayarlar' }]} />
        <ProfileSettingsClient 
          initialFullName={user.user_metadata?.full_name || ''} 
          email={user.email || ''} 
        />
      </div>
    </div>
  );
}
