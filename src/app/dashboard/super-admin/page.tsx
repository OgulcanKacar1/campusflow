import { getSuperAdminStats, getOrganizationsWithDomains } from './actions';
import OrganizationList from './OrganizationList';

export default async function SuperAdminDashboard() {
  const statsList = await getSuperAdminStats();
  const organizations = await getOrganizationsWithDomains();

  // Hesaplamalar
  const totalOrgs = organizations.length;
  const activeOrgs = organizations.filter(o => o.status === 'active').length;
  
  // Stats listesinden toplam kullanıcıyı hesapla
  let totalUsers = 0;
  statsList.forEach(s => {
    totalUsers += (s.student_count || 0) + (s.instructor_count || 0) + (s.admin_count || 0);
  });

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">
          👑 Süper Admin Paneli
        </h1>
        <p className="text-gray-400 mb-8">
          Tüm üniversiteleri, lisansları ve sistemi bu panelden yönetiyorsun.
        </p>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Toplam Üniversite', value: totalOrgs, color: 'from-purple-500/20 to-purple-600/5', border: 'border-purple-500/20' },
            { label: 'Toplam Kullanıcı', value: totalUsers, color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20' },
            { label: 'Aktif Lisans (Okul)', value: activeOrgs, color: 'from-green-500/20 to-green-600/5', border: 'border-green-500/20' },
          ].map((card) => (
            <div
              key={card.label}
              className={`rounded-xl border ${card.border} bg-gradient-to-br ${card.color} p-5`}
            >
              <p className="text-gray-400 text-sm">{card.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        {/* Organizasyon Listesi (Client Component) */}
        <OrganizationList organizations={organizations as any} />
      </div>
    </div>
  );
}
