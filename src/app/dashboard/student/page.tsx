import { getStudentStats, getStudentCourses, getStudentUpcomingTasks } from './actions';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { GraduationCap, BookOpen, Users, LayoutDashboard, Calendar, Search, CheckSquare } from 'lucide-react';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';

// Priority colors for tasks
const PRIORITY_STYLES: Record<string, string> = {
  low: 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20',
  medium: 'text-amber-400 bg-amber-400/10 border-amber-500/20',
  high: 'text-primary bg-primary/10 border-primary/20',
  critical: 'text-red-400 bg-red-400/10 border-red-500/20',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

const STATUS_LABELS: Record<string, string> = {
  todo: 'Yapılacak',
  in_progress: 'Devam Ediyor',
  blocked: 'Bloke',
  review: 'İnceleme',
};

async function getStudentName() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Öğrenci';
  const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
  return data?.full_name || 'Öğrenci';
}

export default async function StudentDashboard() {
  const [statsData, coursesData, tasksData, fullName] = await Promise.all([
    getStudentStats(),
    getStudentCourses(),
    getStudentUpcomingTasks(),
    getStudentName()
  ]);

  const stats = statsData.stats ?? { enrolledCourses: 0, activeCourses: 0, teams: 0 };
  const courses = coursesData.data ?? [];
  const tasks = tasksData.data ?? [];
  const activeCourses = courses.filter(c => c.status === 'active');
  const firstName = fullName.split(' ')[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Günaydın' : hour < 18 ? 'İyi günler' : 'İyi akşamlar';

  return (
    <div className="flex flex-col gap-6 px-6 py-8 min-h-screen">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
        <DashboardBreadcrumb items={[{ label: 'Genel Bakış' }]} />

        {/* Hero Greeting */}
        <div className="mb-4 mt-2">
          <div className="flex items-center gap-2 text-primary/80 text-sm mb-2 font-medium tracking-wide">
            <span>{greeting}, {firstName}</span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground mb-3">Öğrenci Paneli</h1>
          <p className="text-muted-foreground text-sm max-w-2xl leading-relaxed">
            {stats.activeCourses > 0
              ? `${stats.activeCourses} aktif dersin var. Çalışmalarına kaldığın yerden devam edebilirsin.`
              : 'Henüz hiçbir derse kayıtlı değilsin. Sol menüden derslerim sekmesine giderek bir katılım koduyla derse katılabilirsin.'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[
            {
              label: 'Kayıtlı Derslerim',
              value: stats.enrolledCourses,
              icon: GraduationCap,
            },
            {
              label: 'Aktif Dersler',
              value: stats.activeCourses,
              icon: BookOpen,
            },
            {
              label: 'Takımlarım',
              value: stats.teams,
              icon: Users,
            },
          ].map((card) => (
            <div key={card.label} className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl p-5 flex items-center gap-5 shadow-xl shadow-black/40 transition-all hover:border-primary/50 hover:shadow-primary/5">
              <div className="p-3.5 rounded-xl bg-primary/10 flex-shrink-0 ring-1 ring-primary/20">
                <card.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold mb-1">{card.label}</p>
                <p className="text-3xl font-bold text-foreground tracking-tight drop-shadow-md">{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Active Courses */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4" />
              Aktif Derslerim
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeCourses.length > 0 ? (
                activeCourses.map(course => (
                  <Link href={`/dashboard/student/courses/${course.id}`} key={course.id} className="group outline-none">
                    <div className="rounded-2xl border border-border/40 bg-gradient-to-br from-card to-card/50 backdrop-blur-xl p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 flex flex-col h-full gap-4 relative overflow-hidden">
                      {/* Subtle top glow */}
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="flex items-start justify-between">
                        <div className="flex flex-col gap-1.5 z-10">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 w-fit px-2.5 py-1 rounded-full ring-1 ring-primary/20">
                            {course.code}
                          </span>
                          <h3 className="text-lg font-semibold text-foreground line-clamp-2 mt-1 group-hover:text-primary transition-colors drop-shadow-sm">{course.name}</h3>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 text-xs text-muted-foreground mt-auto pt-5 border-t border-border/30">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 opacity-70" />
                          <span>Eğitmen: <span className="text-foreground/90 font-medium">{course.instructorName}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 opacity-70" />
                          <span className="font-medium">{course.term} {course.year}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full rounded-2xl border border-dashed border-border/60 bg-card/20 p-10 flex flex-col items-center justify-center text-center gap-3">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Search className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mt-2">Aktif ders bulunamadı</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Görünüşe göre henüz hiçbir aktif derse dahil değilsin. "Derslerim" sayfasından yeni bir derse katılabilirsin.
                  </p>
                  <Link 
                    href="/dashboard/student/courses"
                    className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Derslere Göz At
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Upcoming Tasks */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Yaklaşan Görevlerim
            </h2>
            
            <div className="flex flex-col gap-3">
              {tasks.length > 0 ? (
                tasks.map(task => (
                  <Link href={`/dashboard/student/courses/${task.courseId}?tab=kanban`} key={task.id} className="group outline-none">
                    <div className="rounded-xl border border-border/40 bg-gradient-to-br from-card to-card/50 backdrop-blur-md p-4 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-0.5 relative overflow-hidden">
                      {/* Left border glow indicator */}
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      <div className="flex items-start justify-between gap-2 mb-2 pl-1">
                        <h4 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors drop-shadow-sm">
                          {task.title}
                        </h4>
                      </div>
                      
                      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-bold mt-4 pl-1">
                        <span className={`px-2.5 py-1 rounded-md border shadow-sm ${PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.medium}`}>
                          {PRIORITY_LABELS[task.priority] ?? 'Orta'}
                        </span>
                        <span className="text-muted-foreground bg-secondary/20 px-2 py-1 rounded-md">
                          {STATUS_LABELS[task.status] ?? task.status}
                        </span>
                      </div>
                      
                      <div className="flex flex-col gap-1 mt-4 pt-3 border-t border-border/30 pl-1">
                        <span className="text-[10px] font-bold text-primary tracking-wide uppercase">{task.courseCode}</span>
                        <span className="text-xs text-muted-foreground truncate">{task.teamName}</span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 flex flex-col items-center justify-center text-center gap-2">
                  <CheckSquare className="w-8 h-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-foreground font-medium">Harika!</p>
                  <p className="text-xs text-muted-foreground">Şu an için atandığın bir görev bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
