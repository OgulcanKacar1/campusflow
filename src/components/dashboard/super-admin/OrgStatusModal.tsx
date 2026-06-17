'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Pause, Play, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { updateOrganizationStatus } from '@/app/dashboard/super-admin/actions';
import type { Organization } from '@/types/organization';

interface Props {
  org: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function OrgStatusModal({ org, open, onOpenChange, onComplete }: Props) {
  const [loading, setLoading] = useState(false);

  if (!org) return null;

  const isSuspending = org.status === 'active';
  const newStatus = isSuspending ? 'suspended' : 'active';

  const handleConfirm = async () => {
    setLoading(true);
    const result = await updateOrganizationStatus(org.id, newStatus);
    setLoading(false);
    if (!result.error) {
      onOpenChange(false);
      onComplete();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm bg-card border border-gray-800 text-white">
        <DialogHeader>
          <div className="flex flex-col items-center text-center gap-3 pb-2">
            <div className={`flex items-center justify-center w-14 h-14 rounded-full border ${
              isSuspending
                ? 'bg-red-500/10 border-red-500/20'
                : 'bg-emerald-500/10 border-emerald-500/20'
            }`}>
              {isSuspending
                ? <ShieldAlert className="w-7 h-7 text-red-400" />
                : <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              }
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-white">
                {isSuspending ? 'Organizasyonu Askıya Al' : 'Organizasyonu Aktif Et'}
              </DialogTitle>
              <DialogDescription className="mt-1.5 text-sm text-gray-400">
                <span className="font-semibold text-white">{org.name}</span>
                {isSuspending
                  ? ' organizasyonu askıya alınacak. Mevcut kullanıcılar sisteme erişemeyecek ve yeni kayıtlar engellenecek.'
                  : ' organizasyonu yeniden aktif edilecek. Kullanıcılar sisteme erişebilecek ve yeni kayıtlara açılacak.'
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="flex gap-2 mt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1 border-gray-700 text-gray-300 hover:bg-white/5"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 border-0 text-white ${
              isSuspending
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {loading
              ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              : isSuspending
                ? <Pause className="mr-2 h-4 w-4" />
                : <Play className="mr-2 h-4 w-4" />
            }
            {isSuspending ? 'Askıya Al' : 'Aktif Et'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
