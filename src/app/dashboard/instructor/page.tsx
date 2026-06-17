import { getInstructorStats, getInstructorCourses } from './actions';
import Link from 'next/link';
import { BookOpen, Users, CalendarCheck, ArrowRight, ArrowUpRight, GraduationCap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';

export default async function InstructorDashboard() {
  const [statsData, coursesData] = await Promise.all([
    getInstructorStats(),
    getInstructorCourses()
  ]);

  if (statsData?.error) {
    return <div className="p-8 text-destructive">Hata: {statsData.error}</div>;
  }

  const stats = statsData?.stats || { activeCourses: 0, totalStudents: 0, upcomingTasks: 0 };
  const recentCourses = (coursesData?.data || []).slice(0, 4);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Hoca Paneli</h1>
          <p className="text-muted-foreground mt-2">
            Verdiğiniz dersleri, kayıtlı öğrencileri ve takımları buradan yönetebilirsiniz.
          </p>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-colors group relative overflow-hidden" style={{ borderColor: 'rgba(59, 130, 246, 0.2)' }}>
            <div className="absolute -right-4 -top-4 p-4 pointer-events-none transition-opacity" style={{ opacity: 0.05 }}>
              <BookOpen className="w-24 h-24 text-blue-500" />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 rounded-xl transition-colors bg-blue-500/10">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Aktif Derslerim</p>
            </div>
            <p className="text-foreground text-3xl font-bold mt-2 tracking-tight relative z-10">{stats.activeCourses}</p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-colors group relative overflow-hidden" style={{ borderColor: 'rgba(16, 185, 129, 0.2)' }}>
            <div className="absolute -right-4 -top-4 p-4 pointer-events-none transition-opacity" style={{ opacity: 0.05 }}>
              <Users className="w-24 h-24 text-emerald-500" />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 rounded-xl transition-colors bg-emerald-500/10">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Kayıtlı Öğrencilerim</p>
            </div>
            <p className="text-foreground text-3xl font-bold mt-2 tracking-tight relative z-10">{stats.totalStudents}</p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-colors group relative overflow-hidden" style={{ borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <div className="absolute -right-4 -top-4 p-4 pointer-events-none transition-opacity" style={{ opacity: 0.05 }}>
              <CalendarCheck className="w-24 h-24 text-amber-500" />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 rounded-xl transition-colors bg-amber-500/10">
                <CalendarCheck className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Bekleyen Görevler</p>
            </div>
            <p className="text-foreground text-3xl font-bold mt-2 tracking-tight relative z-10">{stats.upcomingTasks}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon: Hızlı Eylemler */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Hızlı Eylemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/instructor/courses" className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/40 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Ders Yönetimi</p>
                      <p className="text-xs text-muted-foreground">Yeni ders açın ve yönetin</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-400 group-hover:translate-x-1" style={{ transition: 'all 0.2s' }} />
                </Link>

                <Link href="/dashboard/instructor/teams" className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/40 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Takım Yönetimi</p>
                      <p className="text-xs text-muted-foreground">Proje takımlarını kurun</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-indigo-400 group-hover:translate-x-1" style={{ transition: 'all 0.2s' }} />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Kolon: Aktif / Son Dersler */}
          <div className="lg:col-span-2">
            <Card className="bg-card/40 border-border/50 h-full">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Derslerim</CardTitle>
                  <CardDescription>Aktif ve devam eden dersleriniz</CardDescription>
                </div>
                <Link href="/dashboard/instructor/courses" className="text-sm font-medium flex items-center gap-1 hover:underline" style={{ color: '#ea580c' }}>
                  Tümünü Gör
                </Link>
              </CardHeader>
              <CardContent>
                {recentCourses.length > 0 ? (
                  <div className="space-y-4 mt-2">
                    {recentCourses.map((course) => (
                      <Link 
                        key={course.id} 
                        href={`/dashboard/instructor/courses/${course.id}`}
                        className="flex items-center justify-between p-4 rounded-lg border border-border/40 hover:bg-muted/30 transition-all group bg-background/20"
                        style={{ borderColor: 'var(--border)' }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl border flex items-center justify-center flex-shrink-0 transition-colors" style={{ backgroundColor: 'rgba(249, 115, 22, 0.1)', borderColor: 'rgba(249, 115, 22, 0.2)' }}>
                            <BookOpen className="w-6 h-6" style={{ color: '#ea580c' }} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-foreground flex items-center gap-2">
                              {course.code}
                              <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5 font-medium">{course.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background border border-border/60 text-xs font-medium text-muted-foreground">
                            <GraduationCap className="w-3.5 h-3.5" />
                            {course.studentCount} Öğrenci
                          </div>
                          <Badge variant="outline" className={course.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                            {course.status === 'active' ? 'Aktif' : 'Arşiv'}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-background/20">
                    Henüz oluşturduğunuz bir ders bulunmuyor. Sol menüden hızlıca yeni ders ekleyebilirsiniz.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
