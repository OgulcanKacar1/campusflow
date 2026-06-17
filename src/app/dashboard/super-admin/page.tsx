import { getSuperAdminStats, getOrganizationsWithDomains, getRegistrationTrend } from './actions';
import OverviewCharts from './OverviewCharts';
import { Building2, Users, CheckCircle2 } from 'lucide-react';

interface SuperAdminStatRow {
  organization_name: string;
  student_count: number | null;
  instructor_count: number | null;
  admin_count: number | null;
  domain: string;
  status: string;
}

export default async function SuperAdminDashboard() {
  const statsList = (await getSuperAdminStats()) as SuperAdminStatRow[];
  const organizations = await getOrganizationsWithDomains();
  const trendData = await getRegistrationTrend(30);

  // Hesaplamalar
  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter(o => o.status === 'active').length;
  
  // Stats listesinden toplam kullanıcıyı hesapla
  let totalUsers = 0;
  statsList.forEach((s) => {
    totalUsers += (s.student_count ?? 0) + (s.instructor_count ?? 0) + (s.admin_count ?? 0);
  });

  // Top 5 Üniversite (Öğrenci sayısına göre)
  const topOrgs = [...statsList]
    .sort((a, b) => (b.student_count ?? 0) - (a.student_count ?? 0))
    .slice(0, 5)
    .map((org) => ({
      organization_name: org.organization_name,
      domain: org.domain,
      student_count: org.student_count ?? 0,
      status: org.status,
    }));

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          Süper Admin Paneli
        </h1>
        <p className="text-gray-400 mb-8">
          Tüm üniversiteleri, lisansları ve sistemi bu panelden yönetiyorsun.
        </p>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-6 shadow-sm hover:border-primary/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Toplam Üniversite</p>
            </div>
            <p className="text-foreground text-3xl font-bold mt-2 tracking-tight">{totalOrgs}</p>
          </div>
          
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-6 shadow-sm hover:border-primary/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Toplam Kullanıcı</p>
            </div>
            <p className="text-foreground text-3xl font-bold mt-2 tracking-tight">{totalUsers}</p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-6 shadow-sm hover:border-primary/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Aktif Lisans (Okul)</p>
            </div>
            <p className="text-foreground text-3xl font-bold mt-2 tracking-tight">{activeOrgs}</p>
          </div>
        </div>

        {/* Grafikler ve Top Tablo */}
        <OverviewCharts trendData={trendData} topOrgs={topOrgs} />
      </div>
    </div>
  );
}
