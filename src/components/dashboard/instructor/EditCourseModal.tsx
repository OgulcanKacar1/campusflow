'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Pencil } from 'lucide-react';
import { updateCourse } from '@/app/dashboard/instructor/actions';
import type { InstructorCourse as Course } from '@/types/course';

interface Props {
  course: Course;
  onComplete: () => void;
}

export function EditCourseModal({ course, onComplete }: Props) {
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
