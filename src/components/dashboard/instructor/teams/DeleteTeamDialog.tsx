'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, AlertTriangle } from 'lucide-react';
import { deleteTeam } from '@/app/dashboard/instructor/teams/actions';
import type { Team } from '@/types/team';

interface DeleteTeamDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteTeamDialog({ team, open, onOpenChange, onSuccess }: DeleteTeamDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!team) return;

    setIsDeleting(true);
    setError(null);

    const result = await deleteTeam(team.id, team.courseId);

    if (result.error) {
      setError(result.error);
    } else {
      onOpenChange(false);
      onSuccess?.();
    }

    setIsDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-[#0f1523] border border-gray-800 text-white">
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-3 pb-2">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Takımı Sil
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-gray-400">
                <span className="font-semibold text-white">{team?.name}</span> takımı
                kalıcı olarak silinecek. Tüm üyelikler ve görevler de silinir.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="flex-1 border-gray-700 text-gray-300 hover:bg-white/5"
          >
            İptal
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0"
          >
            {isDeleting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" />
            )}
            Sil
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
