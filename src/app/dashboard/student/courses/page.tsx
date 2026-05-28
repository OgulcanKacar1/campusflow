'use client';

import { useState, useEffect } from 'react';
import { getStudentCourses, joinCourseByCode } from '../actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, ArrowLeft, KeyRound, BookOpen, Users, ClipboardList, ChevronRight, GraduationCap } from 'lucide-react';
import Link from 'next/link';
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

  useEffect(() => { loadCourses(); }, []);

  async function loadCourses() {
    setLoading(true);
    const result = await getStudentCourses();
    if (result.data) setCourses(result.data as Course[]);
    setLoading(false);
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setJoining(true);
    setJoinResult(null);
    const result = await joinCourseByCode(joinCode);
    setJoinResult(result);
    setJoining(false);
    if (result.success) { setJoinCode(''); loadCourses(); }
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/student" className="text-gray-400 hover:text-white flex items-center text-sm w-fit mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" /> Öğrenci Paneline Dön
          </Link>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">Derslerim</h1>
              <p className="text-gray-400 text-sm">{courses.length > 0 ? `${courses.length} derse kayıtlısın` : 'Henüz hiçbir derse kayıtlı değilsin'}</p>
            </div>

            <Dialog open={joinOpen} onOpenChange={(v) => { setJoinOpen(v); if (!v) { setJoinCode(''); setJoinResult(null); } }}>
              <DialogTrigger render={
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold shadow-lg shadow-yellow-500/20">
                  <KeyRound className="w-4 h-4 mr-2" /> Katılım Koduyla Katıl
                </Button>
              } />
              <DialogContent className="sm:max-w-sm bg-[#0f1523] border border-gray-800 text-white">
                <DialogHeader>
                  <DialogTitle>Derse Katıl</DialogTitle>
                  <DialogDescription>Hocanın sana verdiği 6 haneli katılım kodunu gir.</DialogDescription>
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
                    className="text-center text-2xl tracking-[0.4em] font-mono uppercase bg-background h-14"
                    required
                  />
                  <DialogFooter className="border-none bg-transparent p-0">
                    <DialogClose render={<Button type="button" variant="ghost">İptal</Button>} />
                    <Button type="submit" disabled={joining || joinCode.length < 6} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold">
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
            <Button onClick={() => setJoinOpen(true)} className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold mt-2">
              <KeyRound className="w-4 h-4 mr-2" /> Katılım Koduyla Katıl
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map(course => (
              <Link key={course.enrollmentId} href={`/dashboard/student/courses/${course.id}`}>
                <div className={`group relative rounded-2xl border bg-gradient-to-br ${termColors[course.term] || 'from-purple-500/20 to-purple-600/5 border-purple-500/20'} p-6 hover:scale-[1.02] transition-all duration-200 cursor-pointer h-full flex flex-col justify-between min-h-[200px]`}>
                  
                  {/* Top */}
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <span className="text-xs font-bold tracking-widest text-white/40 uppercase">{termLabels[course.term] || course.term} {course.year}</span>
                        {course.section && (
                          <span className="ml-2 text-xs text-white/30">Şube {course.section}</span>
                        )}
                      </div>
                      <Badge className={`text-xs font-normal ${course.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                        {course.status === 'active' ? 'Aktif' : 'Arşiv'}
                      </Badge>
                    </div>

                    <p className="text-sm font-mono text-white/50 mb-1">{course.code}</p>
                    <h2 className="text-xl font-bold text-white leading-tight group-hover:text-yellow-300 transition-colors">{course.name}</h2>
                  </div>

                  {/* Bottom */}
                  <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white">
                        {course.instructorName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-sm text-white/50 truncate max-w-[120px]">{course.instructorName}</span>
                    </div>

                    <div className="flex items-center gap-3 text-white/30 text-xs">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Takımlar</span>
                      <span className="flex items-center gap-1"><ClipboardList className="w-3 h-3" /> Görevler</span>
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
