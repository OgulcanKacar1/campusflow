'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getOrgCourses } from '../actions';

type Course = {
  id: string;
  code: string;
  name: string;
  term: string;
  year: number;
  status: string;
  instructorName: string;
  studentCount: number;
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtreler
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    const result = await getOrgCourses();
    if (result.data) {
      setCourses(result.data as Course[]);
    }
    setLoading(false);
  }

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      // Durum filtresi
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;

      // Arama filtresi
      if (search.trim() !== '') {
        const termStr = search.toLowerCase();
        const matchesCode = c.code.toLowerCase().includes(termStr);
        const matchesName = c.name.toLowerCase().includes(termStr);
        const matchesInstructor = c.instructorName.toLowerCase().includes(termStr);
        if (!matchesCode && !matchesName && !matchesInstructor) return false;
      }

      return true;
    });
  }, [courses, search, statusFilter]);

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
          <Link href="/dashboard/admin" className="text-gray-400 hover:text-white flex items-center text-sm w-fit mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Admin Paneline Dön
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Ders Yönetimi</h1>
          <p className="text-gray-400">
            Üniversitende açılan tüm dersleri, veren hocaları ve kayıtlı öğrenci sayılarını takip edebilirsin.
          </p>
        </div>

        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
                <TabsList className="bg-background/50 border border-border w-full justify-start">
                  <TabsTrigger value="all">Tümü</TabsTrigger>
                  <TabsTrigger value="active">Aktif Dersler</TabsTrigger>
                  <TabsTrigger value="archived">Arşivlenmiş</TabsTrigger>
                  <TabsTrigger value="deleted">Silinmiş</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Kod, ad veya hoca ara..."
                  className="w-full bg-background pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Ders Kodu</TableHead>
                    <TableHead>Ders Adı</TableHead>
                    <TableHead>Dersi Veren</TableHead>
                    <TableHead>Dönem/Yıl</TableHead>
                    <TableHead className="text-center">Öğrenci Sayısı</TableHead>
                    <TableHead className="text-right">Durum</TableHead>
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
                        {search ? 'Aramaya uygun ders bulunamadı.' : 'Henüz bu okulda açılmış bir ders yok.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCourses.map(course => (
                      <TableRow key={course.id}>
                        <TableCell className="font-semibold text-foreground">{course.code}</TableCell>
                        <TableCell className="text-foreground">{course.name}</TableCell>
                        <TableCell className="text-muted-foreground">{course.instructorName}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {course.year} - {translateTerm(course.term)}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          <span className="bg-white/5 px-2 py-1 rounded text-sm text-gray-300">
                            {course.studentCount}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge
                            className={
                              course.status === 'active'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-normal'
                                : course.status === 'archived'
                                ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 font-normal'
                                : 'bg-red-500/10 text-red-400 border-red-500/20 font-normal'
                            }
                          >
                            {course.status === 'active' ? 'Aktif' : course.status === 'archived' ? 'Arşiv' : 'Silinmiş'}
                          </Badge>
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
