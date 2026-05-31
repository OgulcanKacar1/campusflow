'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { updateOrganizationDetails } from '@/app/dashboard/super-admin/actions';
import type { Organization } from '@/types/organization';

interface Props {
  org: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function EditOrganizationModal({ org, open, onOpenChange, onComplete }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!org) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateOrganizationDetails(org.id, formData);

    if (result.error) {
      alert(result.error);
    } else {
      onOpenChange(false);
      onComplete();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Organizasyonu Düzenle</DialogTitle>
          <DialogDescription>
            Organizasyon adı, planı ve öğrenci limitini güncelleyebilirsiniz.
          </DialogDescription>
        </DialogHeader>
        {org && (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Organizasyon Adı</Label>
              <Input id="edit-name" name="name" required defaultValue={org.name} className="bg-background" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Plan</Label>
                <Select name="plan" defaultValue={org.plan}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Plan seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-maxStudents">Öğrenci Limiti</Label>
                <Input id="edit-maxStudents" name="maxStudents" type="number" defaultValue={org.max_students || ''} placeholder="Sınırsız için boş bırakın" className="bg-background" />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>İptal</Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Güncelle
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
