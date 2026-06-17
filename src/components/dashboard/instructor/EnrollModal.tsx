'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, UserPlus, Upload, Plus } from 'lucide-react';
import { enrollStudentsFromCSV } from '@/app/dashboard/instructor/actions';
import type { InstructorCourse as Course } from '@/types/course';

interface Props {
  course: Course;
  onComplete: () => void;
}

type EnrollResult = {
  success?: boolean;
  enrolledCount?: number;
  alreadyEnrolled?: number;
  unregistered?: string[];
  error?: string;
};

export function EnrollModal({ course, onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EnrollResult | null>(null);

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
        <Button variant="ghost" size="sm" className="h-8 text-xs hover:bg-primary/10 hover:text-primary">
          <UserPlus className="w-3.5 h-3.5 mr-1" /> Öğrenci Ekle
        </Button>
      } />
      <DialogContent className="sm:max-w-lg bg-card border border-gray-800 text-white">
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
                className="w-full h-48 px-3 py-2 rounded-md border border-gray-800 bg-background text-sm focus:ring-2 focus:ring-primary outline-none transition-all"
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
                {result.alreadyEnrolled ? ` (${result.alreadyEnrolled} öğrenci zaten kayıtlıydı)` : ''}
              </div>
            )}

            {result.unregistered && result.unregistered.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-yellow-400">Kayıt Edilemeyenler ({result.unregistered.length} öğrenci):</p>
                <div className="max-h-32 overflow-y-auto p-3 rounded-md bg-white/5 border border-border text-xs text-gray-400 font-mono">
                  {result.unregistered.map(email => <div key={email}>{email}</div>)}
                </div>
                <p className="text-[11px] text-gray-500 italic">
                  * Bu öğrenciler henüz CampusFlow&apos;a kayıt olmamışlar. Kayıt olduktan sonra katılım koduyla veya tekrar CSV ile ekleyebilirsiniz.
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
