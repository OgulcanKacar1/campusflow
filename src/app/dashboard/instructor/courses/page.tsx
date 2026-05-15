'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ArrowLeft, Plus, UserPlus, Upload, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { getInstructorCourses, createCourse, enrollStudentsFromCSV, updateCourse, deleteCourse } from '../actions';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';

type Course = {
  id: string;
  code: string;
  name: string;
  term: string;
  year: number;
  section: string | null;
  status: string;
  joinCode: string | null;
  studentCount: number;
};

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function handleCreateCourse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCourse(formData);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      loadCourses(); // Listeyi yenile
    }
    setIsSubmitting(false);
  }

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
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button className="bg-purple-600 hover:bg-purple-700 text-white"><Plus className="w-4 h-4 mr-2" /> Yeni Ders Aç</Button>} />
              <DialogContent className="sm:max-w-md bg-[#0f1523] border border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Yeni Ders Oluştur</DialogTitle>
                  <DialogDescription>
                    Öğrencilerinizin katılabileceği yeni bir ders tanımlayın.
                  </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleCreateCourse} className="space-y-4 py-4">
                  {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded">{error}</div>}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Ders Kodu <span className="text-red-500">*</span></label>
                      <Input name="code" placeholder="Örn: CS401" required className="bg-background" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Şube (Section)</label>
                      <Input name="section" placeholder="Örn: 1, A, Gr 3" className="bg-background" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ders Adı <span className="text-red-500">*</span></label>
                    <Input name="name" placeholder="Örn: Yazılım Mühendisliği" required className="bg-background" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Dönem <span className="text-red-500">*</span></label>
                      <select name="term" required className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                        <option value="fall">Güz (Fall)</option>
                        <option value="spring">Bahar (Spring)</option>
                        <option value="summer">Yaz (Summer)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Yıl <span className="text-red-500">*</span></label>
                      <Input name="year" type="number" min={new Date().getFullYear()} defaultValue={new Date().getFullYear()} required className="bg-background" />
                    </div>
                  </div>

                  <DialogFooter className="mt-6 border-none bg-transparent p-0">
                    <DialogClose render={<Button type="button" variant="ghost">İptal</Button>} />
                    <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white">
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Ders Oluştur
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
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

function EnrollModal({ course, onComplete }: { course: Course; onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ enrolledCount?: number; unregistered?: string[]; error?: string } | null>(null);

  async function handleEnroll(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    const csvContent = formData.get('csvContent') as string;

    const res = await enrollStudentsFromCSV(course.id, csvContent);
    setResult(res);
    setLoading(false);
    
    if (res.success) {
      onComplete();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) setResult(null);
    }}>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-purple-500/10 hover:text-purple-400">
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Öğrenci Ekle
        </Button>
      } />
      <DialogContent className="sm:max-w-lg bg-[#0f1523] border border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Öğrenci Kaydı: {course.code}</DialogTitle>
          <DialogDescription>
            Öğrenci e-postalarını aşağıya yapıştırarak toplu kayıt yapabilirsiniz. 
            Sadece sistemde hesabı olan öğrenciler derse eklenir.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleEnroll} className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">E-posta Listesi (Virgül veya yeni satır ile ayrılmış)</label>
              <textarea
                name="csvContent"
                required
                placeholder="ogrenci1@isik.edu.tr&#10;ogrenci2@isik.edu.tr"
                className="w-full h-48 px-3 py-2 rounded-md border border-gray-800 bg-background text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
              />
            </div>
            <DialogFooter className="border-none bg-transparent p-0">
              <DialogClose render={<Button type="button" variant="ghost">Kapat</Button>} />
              <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                Öğrencileri Kaydet
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-6 space-y-4">
            {result.error && (
              <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {result.error}
              </div>
            )}
            
            {result.enrolledCount !== undefined && (
              <div className="p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                {result.enrolledCount} öğrenci başarıyla derse kayıt edildi.
              </div>
            )}

            {result.unregistered && result.unregistered.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-yellow-400">Kayıt Edilemeyenler ({result.unregistered.length} öğrenci):</p>
                <div className="max-h-32 overflow-y-auto p-3 rounded-md bg-white/5 border border-white/10 text-xs text-gray-400 font-mono">
                  {result.unregistered.map(email => <div key={email}>{email}</div>)}
                </div>
                <p className="text-[11px] text-gray-500 italic">
                  * Bu öğrenciler henüz CampusFlow'a kayıt olmamışlar. Kayıt olduktan sonra katılım koduyla veya tekrar CSV ile ekleyebilirsiniz.
                </p>
              </div>
            )}

            <DialogFooter className="border-none bg-transparent p-0 pt-4">
              <Button onClick={() => setResult(null)} variant="outline" className="w-full">
                Yeni Liste Yükle
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function EditCourseModal({ course, onComplete }: { course: Course; onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await updateCourse(course.id, formData);

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      onComplete();
    }
    setIsSubmitting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      } />
      <DialogContent className="sm:max-w-md bg-[#0f1523] border border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Dersi Düzenle</DialogTitle>
          <DialogDescription>Ders bilgilerini güncelleyin.</DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleEdit} className="space-y-4 py-4">
          {error && <div className="text-red-400 text-sm bg-red-500/10 p-3 rounded">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Ders Kodu</label>
              <Input name="code" defaultValue={course.code} required className="bg-background" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Şube (Section)</label>
              <Input name="section" defaultValue={course.section || ''} className="bg-background" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Ders Adı</label>
            <Input name="name" defaultValue={course.name} required className="bg-background" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Dönem</label>
              <select name="term" defaultValue={course.term} required className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="fall">Güz</option>
                <option value="spring">Bahar</option>
                <option value="summer">Yaz</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Yıl</label>
              <Input name="year" type="number" defaultValue={course.year} required className="bg-background" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Durum</label>
            <select name="status" defaultValue={course.status} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
              <option value="active">Aktif</option>
              <option value="archived">Arşivlendi</option>
            </select>
          </div>

          <DialogFooter className="mt-6 border-none bg-transparent p-0">
            <DialogClose render={<Button type="button" variant="ghost">İptal</Button>} />
            <Button type="submit" disabled={isSubmitting} className="bg-purple-600 hover:bg-purple-700 text-white">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Güncelle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteCourseDialog({ courseId, courseCode, onComplete }: { courseId: string; courseCode: string; onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);
    const result = await deleteCourse(courseId);
    if (!result.error) {
      setOpen(false);
      onComplete();
    }
    setIsDeleting(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500 hover:text-red-400">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      } />
      <DialogContent className="sm:max-w-sm bg-[#0f1523] border border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Dersi Sil?</DialogTitle>
          <DialogDescription>
            <strong className="text-white">{courseCode}</strong> kodlu dersi silmek istediğinize emin misiniz? 
            Bu işlem geri alınamaz ve derse ait tüm kayıtlar, takımlar silinecektir.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 border-none bg-transparent p-0 flex gap-2">
          <DialogClose render={<Button type="button" variant="ghost" className="flex-1">İptal</Button>} />
          <Button onClick={handleDelete} disabled={isDeleting} variant="destructive" className="flex-1 bg-red-600 hover:bg-red-700 text-white">
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Evet, Sil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
