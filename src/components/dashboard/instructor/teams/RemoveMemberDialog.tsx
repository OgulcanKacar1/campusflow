'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, UserX } from 'lucide-react';
import type { Team, TeamMember } from '@/types/team';

interface RemoveMemberDialogProps {
  team: Team | null;
  member: TeamMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void>;
}

export function RemoveMemberDialog({
  team,
  member,
  open,
  onOpenChange,
  onConfirm,
}: RemoveMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    setIsSubmitting(true);
    await onConfirm();
    setIsSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-card border-gray-800 text-white">
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-3 pb-2">
            <div className="flex items-center justify-center w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20">
              <UserX className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                Üyeyi Çıkar
              </DialogTitle>
              <DialogDescription className="mt-2 text-gray-400">
                <span className="text-white font-medium">{member?.studentName || 'İsimsiz'}</span> isimli üyeyi
                <span className="text-white font-medium"> {team?.name}</span> takımından çıkarmak istediğinize emin misiniz?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-gray-700 text-gray-300 hover:bg-white/5"
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Çıkarılıyor...
              </>
            ) : (
              'Evet, Çıkar'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
