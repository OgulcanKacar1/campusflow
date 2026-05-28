'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Loader2, Plus } from 'lucide-react';
import { createCourse } from '@/app/dashboard/instructor/actions';

interface Props {
  onComplete: () => void;
}

export function CreateCourseModal({ onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCourse(formData);

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
        <Button className="bg-purple-600 hover:bg-purple-700 text-white">
          <Plus className="w-4 h-4 mr-2" /> Yeni Ders Aç
        </Button>
      } />
      <DialogContent className="sm:max-w-md bg-[#0f1523] border border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle>Yeni Ders Oluştur</DialogTitle>
          <DialogDescription>
            Öğrencilerinizin katılabileceği yeni bir ders tanımlayın.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreate} className="space-y-4 py-4">
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
  );
}
