'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getInstructorCourses } from '../actions';
import type { InstructorCourse as Course } from '@/types/course';
import { CreateCourseModal } from '@/components/dashboard/instructor/CreateCourseModal';
import { DashboardBreadcrumb } from '@/components/dashboard/DashboardBreadcrumb';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [, startTransition] = useTransition();

  const fetchCourses = useCallback(async () => {
    const result = await getInstructorCourses();
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

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (search.trim() !== '') {
        const termStr = search.toLowerCase();
        const matchesCode = c.code.toLowerCase().includes(termStr);
        const matchesName = c.name.toLowerCase().includes(termStr);
        if (!matchesCode && !matchesName) return false;
      }
      return true;
    });
  }, [courses, search]);

  const translateTerm = (term: string) => {
    if (term === 'fall') return 'Güz';
    if (term === 'spring') return 'Bahar';
    if (term === 'summer') return 'Yaz';
    return term;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        <DashboardBreadcrumb items={[{ label: 'Derslerim' }]} />
        
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Derslerim</h1>
              <p className="text-gray-400">
                Açtığınız tüm dersleri buradan görebilir ve yönetebilirsiniz.
              </p>
            </div>
            
            <CreateCourseModal onComplete={refreshCourses} />
          </div>
        </div>

        {/* Grid Kart Görünümü */}
        <div className="mb-6">
          <div className="relative w-full sm:w-72 mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Ders ara..."
              className="w-full bg-background pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="mb-6 bg-background/50 backdrop-blur-sm border border-border/40 p-1.5 h-auto rounded-xl inline-flex shadow-sm">
              <TabsTrigger value="active" className="rounded-lg px-6 py-2.5 transition-all font-medium text-muted-foreground data-[state=active]:!bg-white/10 data-[state=active]:!text-white data-active:!bg-white/10 data-active:!text-white hover:text-foreground">
                Aktif Dersler
              </TabsTrigger>
              <TabsTrigger value="archived" className="rounded-lg px-6 py-2.5 transition-all font-medium text-muted-foreground data-[state=active]:!bg-white/10 data-[state=active]:!text-white data-active:!bg-white/10 data-active:!text-white hover:text-foreground">
                Arşivlenen Dersler
              </TabsTrigger>
            </TabsList>
            
            {['active', 'archived'].map(status => {
              const list = status === 'active' 
                ? filteredCourses.filter(c => c.status !== 'archived')
                : filteredCourses.filter(c => c.status === 'archived');

              const grouped = list.reduce((acc, course) => {
                const year = course.year || new Date().getFullYear();
                if (!acc[year]) acc[year] = [];
                acc[year].push(course);
                return acc;
              }, {} as Record<number, Course[]>);
              const sortedYears = Object.entries(grouped).sort(([a], [b]) => Number(b) - Number(a));

              return (
                <TabsContent key={status} value={status}>
                  {sortedYears.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">
                        {search 
                          ? `Aramaya uygun ${status === 'active' ? 'aktif' : 'arşivlenmiş'} ders bulunamadı.` 
                          : `Henüz hiç ${status === 'active' ? 'aktif' : 'arşivlenmiş'} dersiniz yok.`}
                      </p>
                    </div>
                  ) : (
                    sortedYears.map(([year, yearCourses]) => (
                      <div key={year} className="mb-10">
                        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-3">
                          <span className="px-3 py-1.5 rounded-lg text-sm font-semibold border bg-white/5 border-white/10 text-white">{year}</span>
                          Dönemi Dersleri
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {yearCourses.map(course => (
                            <Link key={course.id} href={`/dashboard/instructor/courses/${course.id}`} className="group block h-full">
                              <Card className={`h-full bg-card/40 border-border/50 hover:bg-muted/30 transition-all duration-300 overflow-hidden flex flex-col ${status === 'archived' ? 'opacity-80 grayscale-[0.2] hover:grayscale-0' : ''}`} style={{ borderColor: 'var(--border)' }}>
                                <CardContent className="p-6 flex flex-col h-full">
                                  <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors border bg-primary/5 border-primary/10 group-hover:bg-primary/10">
                                        <BookOpen className="w-6 h-6 text-indigo-400" />
                                      </div>
                                      <div>
                                        <h3 className="text-xl font-bold text-foreground group-hover:text-indigo-400 transition-colors flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
                                          {course.code}
                                        </h3>
                                        <p className="text-sm text-muted-foreground font-medium mt-0.5 line-clamp-1">{course.name}</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {course.section && (
                                    <div className="mb-4">
                                      <span className="text-xs font-semibold px-2 py-1 rounded-md bg-background border border-border/60 text-muted-foreground">Şube {course.section}</span>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-3 text-sm mb-5 mt-auto pt-4 border-t border-border/30">
                                    <div>
                                      <p className="text-xs mb-1 text-muted-foreground">Dönem</p>
                                      <p className="font-medium text-foreground">{course.year} - {translateTerm(course.term)}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs mb-1 text-muted-foreground">Öğrenci</p>
                                      <p className="font-medium text-foreground">{course.studentCount} kişi</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between mt-auto">
                                    {course.joinCode && status !== 'archived' ? (
                                      <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 border bg-white/5 border-white/10">
                                        <span className="text-muted-foreground text-xs font-medium">Kod:</span>
                                        <span className="font-mono font-bold text-sm tracking-wider text-white">{course.joinCode}</span>
                                      </div>
                                    ) : (
                                      <div />
                                    )}
                                    <Badge variant="outline" className={status === 'archived' ? 'bg-muted text-muted-foreground' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}>
                                      {status === 'archived' ? 'Arşiv' : course.status === 'active' ? 'Aktif' : 'Pasif'}
                                    </Badge>
                                  </div>
                                </CardContent>
                              </Card>
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

