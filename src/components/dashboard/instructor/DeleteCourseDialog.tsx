'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { deleteCourse } from '@/app/dashboard/instructor/actions';

interface Props {
  courseId: string;
  courseCode: string;
  onComplete: () => void;
}

export function DeleteCourseDialog({ courseId, courseCode, onComplete }: Props) {
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
      <DialogContent className="sm:max-w-sm bg-card border border-gray-800 text-white">
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-3 pb-2">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">Dersi Sil</DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-gray-400">
                <span className="font-mono font-semibold text-white bg-white/5 px-2 py-0.5 rounded">{courseCode}</span>
                {' '}kodlu ders arşivlenecek ve öğrenciler artık bu derse erişemeyecek.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex gap-2 mt-2">
          <DialogClose render={
            <Button type="button" variant="outline" className="flex-1 border-gray-700 text-gray-300 hover:bg-white/5">
              İptal
            </Button>
          } />
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
          >
            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
            Sil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
