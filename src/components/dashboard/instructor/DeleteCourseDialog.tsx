'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Trash2 } from 'lucide-react';
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
      <DialogContent className="sm:max-w-sm bg-[#0f1523] border border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Dersi Sil?</DialogTitle>
          <DialogDescription>
            <strong className="text-white">{courseCode}</strong> kodlu dersi silmek istediğinize emin misiniz?
            Ders arşivlenerek devre dışı bırakılacaktır.
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
