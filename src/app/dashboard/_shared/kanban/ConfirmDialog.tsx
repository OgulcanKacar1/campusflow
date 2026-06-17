'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'default';
  isConfirming?: boolean;
  onConfirm: () => void;
}

const variantStyles = {
  danger: {
    icon: 'text-red-400',
    iconBg: 'bg-red-500/10 border-red-500/20',
    button: 'bg-red-600 hover:bg-red-500 text-white',
  },
  warning: {
    icon: 'text-yellow-400',
    iconBg: 'bg-yellow-500/10 border-yellow-500/20',
    button: 'bg-yellow-600 hover:bg-yellow-500 text-white',
  },
  default: {
    icon: 'text-muted-foreground',
    iconBg: 'bg-slate-500/10 border-slate-500/20',
    button: 'bg-indigo-600 hover:bg-primary text-white',
  },
} as const;

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Onayla',
  cancelLabel = 'Vazgeç',
  variant = 'danger',
  isConfirming = false,
  onConfirm,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  // Otomatik olarak confirm butonuna focus yap
  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => confirmButtonRef.current?.focus(), 50);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const styles = variantStyles[variant];

  return (
    <Dialog open={open} onOpenChange={isConfirming ? undefined : onOpenChange}>
      <DialogContent className="max-w-md border-border bg-card text-white">
        <DialogHeader>
          <div className="flex items-start gap-4">
            <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${styles.iconBg}`}>
              <AlertTriangle className={`h-5 w-5 ${styles.icon}`} />
            </div>
            <div className="space-y-1.5">
              <DialogTitle className="text-base font-semibold text-white leading-snug">
                {title}
              </DialogTitle>
              {description && (
                <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <DialogFooter className="mt-2 flex-row justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
            className="border-border text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {cancelLabel}
          </Button>
          <Button
            ref={confirmButtonRef}
            size="sm"
            onClick={onConfirm}
            disabled={isConfirming}
            className={styles.button}
          >
            {isConfirming && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
