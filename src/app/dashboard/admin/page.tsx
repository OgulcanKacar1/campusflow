import { getAdminDashboardStats } from './actions';
import Link from 'next/link';
import { Users, BookOpen, Settings } from 'lucide-react';

export default async function AdminDashboard() {
  const data = await getAdminDashboardStats();
  
  if (data?.error) {
    return <div className="p-8 text-red-500">Hata: {data.error}</div>;
  }

  const stats = data?.stats || { students: 0, instructors: 0, activeCourses: 0 };
  const org = data?.organization;

  return (
    <div className="p-8">
      <div className="max-w-5xl">
        <h1 className="text-3xl font-bold text-white mb-2">🏫 Okul Admin Paneli</h1>
        <p className="text-gray-400 mb-8">
          {org?.name ? `${org.name} - ` : ''}Üniversitendeki kullanıcıları ve rolleri bu panelden yönetiyorsun.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Toplam Öğrenci', value: `${stats.students} ${org?.max_students ? `/ ${org.max_students}` : ''}`, color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20' },
            { label: 'Toplam Hoca', value: stats.instructors, color: 'from-green-500/20 to-green-600/5', border: 'border-green-500/20' },
            { label: 'Aktif Ders', value: stats.activeCourses, color: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/20' },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border ${card.border} bg-gradient-to-br ${card.color} p-5`}>
              <p className="text-gray-400 text-sm">{card.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold text-white mb-4 mt-12">Hızlı Eylemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/admin/users" className="block group">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:bg-gray-800/50 transition-colors h-full flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <Users size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Kullanıcı Yönetimi</h3>
              </div>
              <p className="text-sm text-gray-400 pl-[44px]">
                Öğrencileri ve hocaları görüntüle, rollerini değiştir.
              </p>
            </div>
          </Link>

          <Link href="/dashboard/admin/settings" className="block group">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:bg-gray-800/50 transition-colors h-full flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                  <Settings size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Okul Ayarları</h3>
              </div>
              <p className="text-sm text-gray-400 pl-[44px]">
                Lisans planını, alan adlarını ve okul detaylarını incele.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
