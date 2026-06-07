'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { updateTeam } from '@/app/dashboard/instructor/teams/actions';
import type { Team } from '@/types/team';

interface EditTeamModalProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditTeamModal({ team, open, onOpenChange, onSuccess }: EditTeamModalProps) {
  const [name, setName] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // team değişince form'u güncelle
  useEffect(() => {
    if (team) {
      setName(team.name);
      setRepoUrl(team.repoUrl || '');
      setError(null);
    }
  }, [team]);

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onOpenChange(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!team) return;
    if (!name.trim()) {
      setError('Takım adı gereklidir');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await updateTeam(team.id, team.courseId, {
      name: name.trim(),
      repoUrl: repoUrl.trim() || undefined,
    });

    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
      onSuccess?.();
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#0f1523] border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Takımı Düzenle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name" className="text-gray-300">
              Takım Adı <span className="text-red-400">*</span>
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#1a1f2e] border-gray-700 text-white"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-repo" className="text-gray-300">
              Repo URL
            </Label>
            <Input
              id="edit-repo"
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
              onClick={() => onOpenChange(false)}
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
                  Kaydediliyor...
                </>
              ) : (
                'Kaydet'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
