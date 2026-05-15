import { getStudentStats } from './actions';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { GraduationCap, ClipboardList, Users, BookOpen, ChevronRight, Sparkles } from 'lucide-react';

async function getStudentName() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Öğrenci';
  const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  return data?.full_name || 'Öğrenci';
}

export default async function StudentDashboard() {
  const [statsData, fullName] = await Promise.all([getStudentStats(), getStudentName()]);
  const stats = (statsData as any)?.stats || { enrolledCourses: 0, activeCourses: 0, teams: 0 };
  const firstName = fullName.split(' ')[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  return (
    <div className="p-8">
      <div className="max-w-5xl">

        {/* Hero Greeting */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-yellow-400/70 text-sm mb-2">
            <Sparkles className="w-4 h-4" />
            <span>{greeting}, {firstName}!</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Öğrenci Panelin</h1>
          <p className="text-gray-400">
            {stats.activeCourses > 0
              ? `${stats.activeCourses} aktif dersin var. Haydi devam edelim! 🚀`
              : 'Henüz hiçbir derse kayıtlı değilsin. Bir katılım koduyla başlayabilirsin.'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {[
            {
              label: 'Kayıtlı Derslerim',
              value: stats.enrolledCourses,
              icon: GraduationCap,
              color: 'text-yellow-400',
              bg: 'bg-yellow-500/10',
              border: 'border-yellow-500/20',
              gradient: 'from-yellow-500/10 to-transparent',
            },
            {
              label: 'Aktif Dersler',
              value: stats.activeCourses,
              icon: BookOpen,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
              border: 'border-blue-500/20',
              gradient: 'from-blue-500/10 to-transparent',
            },
            {
              label: 'Takımlarım',
              value: stats.teams,
              icon: Users,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
              border: 'border-emerald-500/20',
              gradient: 'from-emerald-500/10 to-transparent',
            },
          ].map((card) => (
            <div key={card.label} className={`rounded-2xl border ${card.border} bg-gradient-to-br ${card.gradient} p-6 flex items-center gap-4`}>
              <div className={`p-3 rounded-xl ${card.bg} flex-shrink-0`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">{card.label}</p>
                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Links */}
        <h2 className="text-lg font-semibold text-white/60 uppercase tracking-wider text-xs mb-4">Hızlı Erişim</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/dashboard/student/courses" className="group">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-6 transition-all duration-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 transition-colors">
                  <GraduationCap className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Derslerim</h3>
                  <p className="text-sm text-gray-500">
                    {stats.enrolledCourses > 0 ? `${stats.enrolledCourses} derse kayıtlısın` : 'Katılım koduyla derse katıl'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link href="/dashboard/student/tasks" className="group">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] p-6 transition-all duration-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors">
                  <ClipboardList className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Görevlerim</h3>
                  <p className="text-sm text-gray-500">Aktif sprint ve görevleri takip et</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          <Link href="/dashboard/student/courses" className="group md:col-span-2">
            <div className="rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/5 hover:from-purple-500/15 p-6 transition-all duration-200 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition-colors">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">Takımlarım</h3>
                  <p className="text-sm text-gray-500">Proje takımlarını ve sprint boardları görüntüle</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white/50 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
