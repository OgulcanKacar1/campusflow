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
            <TabsList className="mb-6 bg-[#0f1523] border border-gray-800">
              <TabsTrigger value="active" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">Aktif Dersler</TabsTrigger>
              <TabsTrigger value="archived" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white">Arşivlenen Dersler</TabsTrigger>
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
                        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <span className="bg-white/10 px-3 py-1 rounded-md text-sm">{year}</span>
                          Dönemi Dersleri
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {yearCourses.map(course => (
                            <Link key={course.id} href={`/dashboard/instructor/courses/${course.id}`} className="group block">
                              <Card className={`h-full bg-[#0f1523] border-gray-800 hover:shadow-lg transition-all duration-300 overflow-hidden ${status === 'archived' ? 'hover:border-yellow-500/50 hover:shadow-yellow-500/10 opacity-80' : 'hover:border-blue-500/50 hover:shadow-blue-500/10 hover:-translate-y-1'}`}>
                                <div className={`h-2 w-full ${status === 'archived' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : course.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'}`} />
                                <CardContent className="p-5">
                                  <div className="flex items-start justify-between mb-3">
                                    <div>
                                      <h3 className={`text-xl font-bold transition-colors ${status === 'archived' ? 'text-gray-300 group-hover:text-yellow-400' : 'text-white group-hover:text-blue-400'}`}>{course.code}</h3>
                                      {course.section && <span className="text-xs text-gray-500">Şube {course.section}</span>}
                                    </div>
                                    <Badge variant="outline" className={status === 'archived' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs' : course.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs' : 'bg-gray-500/10 text-gray-400 border-gray-500/20 text-xs'}>
                                      {status === 'archived' ? 'Arşiv' : course.status === 'active' ? 'Aktif' : 'Pasif'}
                                    </Badge>
                                  </div>
                                  <p className={`text-sm mb-4 line-clamp-2 ${status === 'archived' ? 'text-gray-500' : 'text-gray-400'}`}>{course.name}</p>
                                  <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                                    <div className="bg-white/5 rounded-lg p-2">
                                      <p className={`text-xs mb-1 ${status === 'archived' ? 'text-gray-600' : 'text-gray-500'}`}>Dönem</p>
                                      <p className={`font-medium ${status === 'archived' ? 'text-gray-400' : 'text-white'}`}>{course.year} - {translateTerm(course.term)}</p>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2">
                                      <p className={`text-xs mb-1 ${status === 'archived' ? 'text-gray-600' : 'text-gray-500'}`}>Öğrenci</p>
                                      <p className={`font-medium ${status === 'archived' ? 'text-gray-400' : 'text-white'}`}>{course.studentCount} kişi</p>
                                    </div>
                                  </div>
                                  {course.joinCode && status !== 'archived' && (
                                    <div className="flex items-center gap-2 bg-purple-500/10 rounded-lg px-3 py-2">
                                      <span className="text-gray-500 text-xs">Katılım Kodu:</span>
                                      <span className="font-mono text-purple-400 font-semibold text-sm">{course.joinCode}</span>
                                    </div>
                                  )}
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

