'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import { getStudentCourses, joinCourseByCode } from '../actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft, KeyRound, BookOpen, Users, ClipboardList, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';
import type { StudentCourse as Course } from '@/types/course';

const termColors: Record<string, string> = {
  fall:   'from-orange-500/20 to-amber-500/5   border-orange-500/20',
  spring: 'from-emerald-500/20 to-green-500/5  border-emerald-500/20',
  summer: 'from-sky-500/20 to-blue-500/5       border-sky-500/20',
};

const termLabels: Record<string, string> = {
  fall: 'Güz', spring: 'Bahar', summer: 'Yaz',
};

export default function StudentCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinResult, setJoinResult] = useState<{ error?: string; success?: boolean } | null>(null);

  const [, startTransition] = useTransition();

  const fetchCourses = useCallback(async () => {
    const result = await getStudentCourses();
    return result.data ?? [];
  }, []);

  const refreshCourses = useCallback(() => {
    fetchCourses().then((list) => {
      startTransition(() => setCourses(list));
    });
  }, [fetchCourses, startTransition]);

  useEffect(() => {
    let cancelled = false;
    startTransition(() => setLoading(true));

    fetchCourses().then((list) => {
      if (cancelled) return;
      startTransition(() => {
        setCourses(list);
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [fetchCourses, startTransition]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    setJoinResult(null);
    const result = await joinCourseByCode(joinCode);
    setJoinResult(result);
    setJoining(false);
    if (result.success) {
      setJoinCode('');
      refreshCourses();
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <DashboardBreadcrumb items={[{ label: 'Derslerim' }]} />

        {/* Header */}
        <div className="mb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Derslerim</h1>
              <p className="text-gray-400 text-sm">{courses.length > 0 ? `${courses.length} derse kayıtlısın` : 'Henüz hiçbir derse kayıtlı değilsin'}</p>
            </div>

            <Dialog open={joinOpen} onOpenChange={(v) => { setJoinOpen(v); if (!v) { setJoinCode(''); setJoinResult(null); } }}>
              <DialogTrigger render={
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px] px-5 py-2.5 shadow-md shadow-primary/20 transition-all">
                  <KeyRound className="w-4 h-4 mr-2" /> Katılım Koduyla Katıl
                </Button>
              } />
              <DialogContent className="sm:max-w-sm bg-card/60 backdrop-blur-3xl border border-border/40 shadow-2xl shadow-black/50 text-foreground overflow-hidden">
                {/* Decorative Glow */}
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                <DialogHeader className="relative z-10">
                  <DialogTitle className="text-xl font-bold text-foreground drop-shadow-sm flex items-center gap-2">
                    <KeyRound className="text-primary w-5 h-5" /> Derse Katıl
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">Hocanın sana verdiği 6 haneli katılım kodunu gir.</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleJoin} className="space-y-4 py-4">
                  {joinResult?.error && (
                    <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded border border-red-500/20">{joinResult.error}</div>
                  )}
                  {joinResult?.success && (
                    <div className="text-emerald-400 text-sm bg-emerald-500/10 p-3 rounded border border-emerald-500/20">🎉 Derse başarıyla katıldın!</div>
                  )}
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="A7B9X2"
                    maxLength={6}
                    className="text-center text-2xl tracking-[0.4em] font-mono uppercase bg-background/40 border-border/50 focus:ring-1 focus:ring-primary/40 h-14 transition-all relative z-10"
                    required
                  />
                  <DialogFooter className="border-none bg-transparent p-0 relative z-10">
                    <DialogClose render={<Button type="button" variant="ghost" className="hover:bg-white/5 text-muted-foreground">İptal</Button>} />
                    <Button type="submit" disabled={joining || joinCode.length < 6} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px] px-5 py-2.5 shadow-md shadow-primary/20 transition-all">
                      {joining && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Katıl
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Course Cards */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : courses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-gray-600" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Henüz hiçbir derse kayıtlı değilsin</p>
              <p className="text-gray-500 text-sm mt-1">Hocanın sana verdiği katılım koduyla derse katılabilirsin.</p>
            </div>
            <Button onClick={() => setJoinOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px] px-5 py-2.5 shadow-md shadow-primary/20 mt-2 transition-all">
              <KeyRound className="w-4 h-4 mr-2" /> Katılım Koduyla Katıl
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full mt-2">
            <TabsList className="mb-8 bg-background/40 backdrop-blur-sm border border-border/40 p-1 rounded-xl inline-flex h-auto">
              <TabsTrigger value="active" className="rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">Aktif Dersler</TabsTrigger>
              <TabsTrigger value="archived" className="rounded-lg px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-muted-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all">Arşivlenen Dersler</TabsTrigger>
            </TabsList>
            
            {['active', 'archived'].map(status => {
              const filteredList = courses.filter(c => c.status === status);
              
              const grouped = filteredList.reduce((acc, course) => {
                const year = course.year || new Date().getFullYear();
                if (!acc[year]) acc[year] = [];
                acc[year].push(course);
                return acc;
              }, {} as Record<number, Course[]>);
              const sortedYears = Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a));

              return (
                <TabsContent key={status} value={status}>
                  {sortedYears.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center">
                      <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
                        <BookOpen className="w-10 h-10 text-gray-600" />
                      </div>
                      <p className="text-gray-500 text-lg">{status === 'active' ? 'Henüz aktif bir derse kayıtlı değilsin.' : 'Arşivlenmiş dersin bulunmuyor.'}</p>
                    </div>
                  ) : (
                    sortedYears.map(([year, yearCourses]) => (
                      <div key={year} className="mb-10">
                        <h2 className="text-xl font-bold text-foreground drop-shadow-sm mb-5 flex items-center gap-3">
                          <span className="bg-primary/20 text-primary ring-1 ring-primary/30 px-3 py-1 rounded-lg text-sm">{year}</span>
                          Dönemi Dersleri
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                          {yearCourses.map(course => (
                            <Link key={course.enrollmentId} href={`/dashboard/student/courses/${course.id}`}>
                              <div className={`group relative rounded-2xl border bg-card/40 backdrop-blur-xl border-border/40 shadow-xl shadow-black/20 p-6 hover:shadow-2xl hover:shadow-primary/20 hover:border-primary/50 hover:-translate-y-1 transition-all duration-300 cursor-pointer h-full flex flex-col justify-between min-h-[200px] ${status === 'archived' ? 'opacity-80' : ''}`}>
                                <div>
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <span className="text-[10px] font-bold tracking-widest text-primary uppercase bg-primary/10 px-2 py-1 rounded-md ring-1 ring-primary/20">{termLabels[course.term] || course.term} {course.year}</span>
                                      {course.section && <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Şube {course.section}</span>}
                                    </div>
                                    <Badge className={`text-[10px] uppercase tracking-widest font-bold ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-secondary/30 text-muted-foreground border-secondary/30'}`}>
                                      {course.status === 'active' ? 'Aktif' : 'Arşiv'}
                                    </Badge>
                                  </div>
                                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 mt-4">{course.code}</p>
                                  <h2 className={`text-xl font-bold text-foreground leading-tight drop-shadow-sm transition-colors group-hover:text-primary`}>{course.name}</h2>
                                </div>
                                <div className="mt-5 pt-4 border-t border-border/40 flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 ring-1 ring-primary/30 flex items-center justify-center text-xs font-bold text-primary">
                                      {course.instructorName?.charAt(0)?.toUpperCase() || '?'}
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground truncate max-w-[120px]">{course.instructorName}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-muted-foreground text-xs">
                                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Takımlar</span>
                                    <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Görevler</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                  </div>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}
