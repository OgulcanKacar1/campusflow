'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Loader2, CheckCircle } from 'lucide-react';
import { createTeam } from '@/app/dashboard/instructor/teams/actions';

interface CreateTeamButtonProps {
  courseId: string;
}

export function CreateTeamButton({ courseId }: CreateTeamButtonProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Takım adı gereklidir');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createTeam({
      courseId,
      name: name.trim(),
      repoUrl: repoUrl.trim() || undefined,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      setName('');
      setRepoUrl('');
      setSuccessOpen(true);
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Plus className="w-4 h-4 mr-2" />
        Takım Oluştur
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f1523] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Yeni Takım Oluştur</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">
                Takım Adı <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Alpha Takımı"
                className="bg-[#1a1f2e] border-gray-700 text-white"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repoUrl" className="text-gray-300">
                Repo URL (Opsiyonel)
              </Label>
              <Input
                id="repoUrl"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="bg-[#1a1f2e] border-gray-700 text-white"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
                className="border-gray-700 text-gray-300"
              >
                İptal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  'Oluştur'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Başarı Modal'ı */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-sm bg-[#0f1523] border-gray-800 text-white">
          <DialogHeader>
            <div className="flex flex-col items-center text-center gap-3 py-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  Takım Oluşturuldu
                </DialogTitle>
                <DialogDescription className="mt-2 text-gray-400">
                  Yeni takım başarıyla oluşturuldu.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex justify-center mt-2">
            <Button
              onClick={() => {
                // Aynı sayfada yenile (cache bypass)
                window.location.href = window.location.pathname + '?t=' + Date.now();
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Tamam
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
