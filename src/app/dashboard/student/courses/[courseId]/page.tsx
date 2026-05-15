import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Users, ClipboardList, Calendar, KeyRound } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

async function getCourseDetail(courseId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Öğrencinin bu derse kayıtlı olduğunu doğrula
  const { data: enrollment } = await supabase
    .from('course_enrollments')
    .select('id')
    .eq('student_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) return null;

  // Ders detaylarını RPC ile çek
  const { data: courses } = await supabase.rpc('get_my_enrolled_courses');
  return (courses || []).find((c: any) => c.course_id === courseId) || null;
}

const termLabels: Record<string, string> = {
  fall: 'Güz', spring: 'Bahar', summer: 'Yaz',
};

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseDetail(courseId);

  if (!course) return notFound();

  return (
    <div className="p-8">
      <div className="max-w-5xl">
        {/* Breadcrumb */}
        <Link href="/dashboard/student/courses" className="text-gray-400 hover:text-white flex items-center text-sm w-fit mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" /> Derslerime Dön
        </Link>

        {/* Course Hero */}
        <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-transparent p-8 mb-8">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs font-mono text-white/40 tracking-widest uppercase mb-1">{course.code}</p>
              <h1 className="text-4xl font-bold text-white mb-3">{course.name}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <Badge className="bg-white/10 text-white/70 border-white/10 font-normal text-sm">
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  {termLabels[course.term] || course.term} {course.year}
                </Badge>
                {course.section && (
                  <Badge className="bg-white/10 text-white/70 border-white/10 font-normal text-sm">
                    Şube {course.section}
                  </Badge>
                )}
                <Badge className={`font-normal text-sm ${course.course_status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                  {course.course_status === 'active' ? 'Aktif' : 'Arşiv'}
                </Badge>
              </div>
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 border border-white/10">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-white font-bold">
                {course.instructor_name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-xs text-white/40">Hoca</p>
                <p className="text-sm font-semibold text-white">{course.instructor_name}</p>
              </div>
            </div>
          </div>

          {/* Join Code */}
          {course.join_code && (
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-white/50">Katılım Kodu:</span>
              <span className="font-mono font-bold tracking-widest text-yellow-400 bg-yellow-500/10 px-3 py-1 rounded border border-yellow-500/20">
                {course.join_code}
              </span>
            </div>
          )}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Takımlar */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Takımlar</h2>
            </div>
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-white/30 text-sm">Henüz takım atanmadı</p>
              <p className="text-white/20 text-xs mt-1">Hocan takımları oluşturduğunda burada görünecek.</p>
            </div>
          </div>

          {/* Görevler */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <ClipboardList className="w-5 h-5 text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-white">Görevler</h2>
            </div>
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <p className="text-white/30 text-sm">Henüz görev eklenmedi</p>
              <p className="text-white/20 text-xs mt-1">Hocan görev oluşturduğunda burada görünecek.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
