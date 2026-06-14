import { getInstructorStats } from './actions';
import Link from 'next/link';
import { BookOpen, Users } from 'lucide-react';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';

export default async function InstructorDashboard() {
  const data = await getInstructorStats();

  if (data?.error) {
    return <div className="p-8 text-red-500">Hata: {data.error}</div>;
  }

  const stats = data?.stats || { activeCourses: 0, totalStudents: 0, upcomingTasks: 0 };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <DashboardBreadcrumb items={[{ label: 'Genel Bakış' }]} />
        
        <div>
        <h1 className="text-3xl font-bold text-white mb-2">🎓 Hoca Paneli</h1>
        <p className="text-gray-400 mb-8">
          Verdiğiniz dersleri, kayıtlı öğrencileri ve takımları buradan yönetebilirsiniz.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Aktif Derslerim', value: stats.activeCourses, color: 'from-blue-500/20 to-blue-600/5', border: 'border-blue-500/20' },
            { label: 'Kayıtlı Öğrencilerim', value: stats.totalStudents, color: 'from-green-500/20 to-green-600/5', border: 'border-green-500/20' },
            { label: 'Bekleyen Görevler', value: stats.upcomingTasks, color: 'from-orange-500/20 to-orange-600/5', border: 'border-orange-500/20' },
          ].map((card) => (
            <div key={card.label} className={`rounded-xl border ${card.border} bg-gradient-to-br ${card.color} p-5`}>
              <p className="text-gray-400 text-sm">{card.label}</p>
              <p className="text-white text-2xl font-bold mt-1">{card.value}</p>
            </div>
          ))}
        </div>

        </div>

        <div>
          <h2 className="text-xl font-bold text-white mb-4 mt-8">Hızlı Eylemler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/instructor/courses" className="block group">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:bg-gray-800/50 transition-colors h-full flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <BookOpen size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Derslerim</h3>
              </div>
              <p className="text-sm text-gray-400 pl-[44px]">
                Yeni ders açın, &quot;Katılım Kodu&quot; oluşturun ve öğrenci listelerini CSV ile yönetin.
              </p>
            </div>
          </Link>

          <Link href="/dashboard/instructor/teams" className="block group">
            <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-5 hover:bg-gray-800/50 transition-colors h-full flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                  <Users size={20} />
                </div>
                <h3 className="text-lg font-semibold text-white">Takım Yönetimi</h3>
              </div>
              <p className="text-sm text-gray-400 pl-[44px]">
                Öğrencilerin proje takımlarını kurun, düzenleyin veya otomatik takım oluşturun.
              </p>
            </div>
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
