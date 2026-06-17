import { getInstructorCourses } from '../actions';
import Link from 'next/link';
import { Users, ArrowRight, BookOpen, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function GlobalTeamsPage() {
  const result = await getInstructorCourses();
  
  if (result.error) {
    return <div className="p-8 text-destructive">Hata: {result.error}</div>;
  }

  const courses = result.data || [];

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <Link href="/dashboard/instructor" className="text-muted-foreground hover:text-foreground flex items-center text-sm w-fit mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Genel Bakışa Dön
          </Link>
          <h1 className="text-3xl font-bold text-foreground tracking-tight flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Users className="w-6 h-6 text-primary" />
            </div>
            Takım Yönetimi
          </h1>
          <p className="text-muted-foreground mt-2">
            Takımlarını yönetmek istediğiniz dersi seçin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.length > 0 ? (
            courses.map((course) => (
              <Link key={course.id} href={`/dashboard/instructor/courses/${course.id}`} className="group">
                <Card className="bg-card/40 border-border/50 hover:bg-muted/30 transition-all hover:border-primary/40 h-full">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                        <BookOpen className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">{course.code}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{course.name}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                  </CardContent>
                </Card>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-background/20">
              Henüz oluşturduğunuz bir ders bulunmuyor. Takım yönetimi yapabilmek için önce bir ders açmalısınız.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
