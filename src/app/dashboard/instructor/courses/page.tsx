'use client';

import { useState, useEffect, useMemo, useCallback, useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, BookOpen, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getInstructorCourses } from '../actions';
import type { InstructorCourse as Course } from '@/types/course';
import { CreateCourseModal } from '@/components/dashboard/instructor/CreateCourseModal';

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
    <div className="p-8">
      <div className="max-w-6xl">
        <div className="mb-6">
          <Link href="/dashboard/instructor" className="text-gray-400 hover:text-white flex items-center text-sm w-fit mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Hoca Paneline Dön
          </Link>
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
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg">{search ? 'Aramaya uygun ders bulunamadı.' : 'Henüz hiç ders açmadınız.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <Link 
                key={course.id} 
                href={`/dashboard/instructor/courses/${course.id}`}
                className="group block"
              >
                <Card className="h-full bg-[#0f1523] border-gray-800 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  {/* Renkli üst bar */}
                  <div className={`
                    h-2 w-full
                    ${course.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : ''}
                    ${course.status === 'archived' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : ''}
                    ${course.status === 'deleted' ? 'bg-gradient-to-r from-red-500 to-red-600' : ''}
                  `} />
                  
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                          {course.code}
                        </h3>
                        {course.section && (
                          <span className="text-xs text-gray-500">Şube {course.section}</span>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          course.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs'
                            : course.status === 'archived'
                            ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-xs'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 text-xs'
                        }
                      >
                        {course.status === 'active' ? 'Aktif' : course.status === 'archived' ? 'Arşiv' : 'Silinmiş'}
                      </Badge>
                    </div>
                    
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{course.name}</p>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-gray-500 text-xs mb-1">Dönem</p>
                        <p className="text-white font-medium">{course.year} - {translateTerm(course.term)}</p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-2">
                        <p className="text-gray-500 text-xs mb-1">Öğrenci</p>
                        <p className="text-white font-medium">{course.studentCount} kişi</p>
                      </div>
                    </div>
                    
                    {/* Join Code */}
                    {course.joinCode && (
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
        )}
      </div>
    </div>
  );
}

