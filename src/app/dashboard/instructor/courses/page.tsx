'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import { getInstructorCourses } from '../actions';
import type { InstructorCourse as Course } from '@/types/course';
import { CreateCourseModal } from '@/components/dashboard/instructor/CreateCourseModal';
import { EnrollModal } from '@/components/dashboard/instructor/EnrollModal';
import { EditCourseModal } from '@/components/dashboard/instructor/EditCourseModal';
import { DeleteCourseDialog } from '@/components/dashboard/instructor/DeleteCourseDialog';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    const result = await getInstructorCourses();
    if (result.data) {
      setCourses(result.data as Course[]);
    }
    setLoading(false);
  }

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
            
            <CreateCourseModal onComplete={loadCourses} />
          </div>
        </div>

        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Ders kodu veya adıyla ara..."
                className="w-full bg-background pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Ders Kodu</TableHead>
                    <TableHead>Ders Adı</TableHead>
                    <TableHead>Dönem/Yıl</TableHead>
                    <TableHead className="text-center">Öğrenci Sayısı</TableHead>
                    <TableHead className="text-center">Katılım Kodu</TableHead>
                    <TableHead className="text-right">İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredCourses.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        {search ? 'Aramaya uygun ders bulunamadı.' : 'Henüz hiç ders açmadınız.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-semibold text-foreground">
                          {course.code}
                          {course.section && <span className="ml-2 text-xs font-normal text-muted-foreground">Şube: {course.section}</span>}
                        </TableCell>
                        <TableCell className="text-foreground">{course.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {course.year} - {translateTerm(course.term)}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          <span className="bg-white/5 px-2 py-1 rounded text-sm text-gray-300">
                            {course.studentCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {course.joinCode ? (
                            <Badge variant="outline" className="font-mono bg-purple-500/10 text-purple-400 border-purple-500/30">
                              {course.joinCode}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1 items-center">
                            <Link
                              href={`/dashboard/instructor/courses/${course.id}/teams`}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-blue-600 text-white hover:bg-blue-700 h-8 w-8 p-0"
                              title="Takımlar"
                            >
                              <Users className="h-4 w-4" />
                            </Link>
                            <EnrollModal course={course} onComplete={loadCourses} />
                            <EditCourseModal course={course} onComplete={loadCourses} />
                            <DeleteCourseDialog courseId={course.id} courseCode={course.code} onComplete={loadCourses} />
                            <Badge
                              className={
                                course.status === 'active'
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-normal ml-2'
                                  : course.status === 'archived'
                                  ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 font-normal ml-2'
                                  : 'bg-red-500/10 text-red-400 border-red-500/20 font-normal ml-2'
                              }
                            >
                              {course.status === 'active' ? 'Aktif' : course.status === 'archived' ? 'Arşiv' : 'Silinmiş'}
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

