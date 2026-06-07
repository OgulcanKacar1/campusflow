'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shuffle, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { createRandomTeams } from '@/app/dashboard/instructor/teams/actions';

interface RandomTeamsButtonProps {
  courseId: string;
  defaultTeamSize?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  onSuccess?: () => void;
}

export function RandomTeamsButton({
  courseId,
  defaultTeamSize = 3,
  minTeamSize,
  maxTeamSize,
  onSuccess,
}: RandomTeamsButtonProps) {
  const [open, setOpen] = useState(false);
  const normalizedMinSize = Math.max(1, minTeamSize ?? 1);
  const normalizedMaxSize = Math.max(normalizedMinSize, maxTeamSize ?? Math.max(normalizedMinSize, 20));

  const [, startTransition] = useTransition();

  const clampSize = useCallback(
    (value: number) => {
      if (Number.isNaN(value) || value <= 0) return normalizedMinSize;
      return Math.min(Math.max(value, normalizedMinSize), normalizedMaxSize);
    },
    [normalizedMinSize, normalizedMaxSize]
  );

  const [size, setSize] = useState(() => clampSize(defaultTeamSize).toString());
  const [prefix, setPrefix] = useState('Takım');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  useEffect(() => {
    startTransition(() => {
      const initial = clampSize(defaultTeamSize);
      setSize(initial.toString());
    });
  }, [defaultTeamSize, clampSize, startTransition]);

  const handleSizeChange = (value: string) => {
    setSize(value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numSize = parseInt(size, 10);
    if (isNaN(numSize)) {
      setError('Geçerli bir takım büyüklüğü girin');
      return;
    }

    if (numSize < normalizedMinSize || numSize > normalizedMaxSize) {
      setError(`Takım büyüklüğü ${normalizedMinSize}-${normalizedMaxSize} arasında olmalı`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await createRandomTeams({
      courseId,
      teamSize: numSize,
      teamPrefix: prefix.trim() || 'Takım',
    });

    if (result.error) {
      setError(result.error);
    } else {
      setOpen(false);
      // Başarılı oluşturma sayısı
      const createdCount = result.data?.length || 0;
      if (createdCount === 0) {
        setError('Derse kayıtlı öğrenci bulunamadı. Önce öğrenci ekleyin.');
        return;
      }
      setCreatedCount(createdCount);
      setSuccessOpen(true);
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className="border-purple-600 text-purple-400 hover:bg-purple-600/10"
      >
        <Shuffle className="w-4 h-4 mr-2" />
        Rastgele Takımlar
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-[#0f1523] border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Shuffle className="w-5 h-5 text-purple-400" />
              Rastgele Takımlar Oluştur
            </DialogTitle>
          </DialogHeader>

          <div className="mt-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded flex gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-yellow-400">
              Bu işlem derse kayıtlı tüm öğrencileri rastgele gruplara böler.
              Mevcut takımlar etkilenmez.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="size" className="text-gray-300">
                Her Takımdaki Öğrenci Sayısı
              </Label>
              <Input
                id="size"
                type="number"
                min={normalizedMinSize}
                max={normalizedMaxSize}
                value={size}
                onChange={(e) => handleSizeChange(e.target.value)}
                className="bg-[#1a1f2e] border-gray-700 text-white"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Min: {normalizedMinSize}, Max: {normalizedMaxSize}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prefix" className="text-gray-300">
                Takım İsim Öneki
              </Label>
              <Input
                id="prefix"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="Örn: Takım, Grup, Squad..."
                className="bg-[#1a1f2e] border-gray-700 text-white"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Örnek: &quot;{prefix} 1&quot;, &quot;{prefix} 2&quot;, ...
              </p>
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
                disabled={isSubmitting}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <Shuffle className="w-4 h-4 mr-2" />
                    Oluştur
                  </>
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
                  Takımlar Oluşturuldu
                </DialogTitle>
                <DialogDescription className="mt-2 text-gray-400">
                  {createdCount} takım başarıyla oluşturuldu ve öğrenciler otomatik olarak atandı.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="flex justify-center mt-2">
            <Button
              onClick={() => setSuccessOpen(false)}
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
