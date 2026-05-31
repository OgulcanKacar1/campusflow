'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { createOrganization } from '@/app/dashboard/super-admin/actions';

interface Props {
  onComplete: () => void;
}

type ExtraDomain = { domain: string; role_hint: string };

export function CreateOrganizationModal({ onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [extraDomains, setExtraDomains] = useState<ExtraDomain[]>([]);

  const handleAddDomain = () => setExtraDomains(prev => [...prev, { domain: '', role_hint: 'student' }]);

  const handleDomainChange = (index: number, field: keyof ExtraDomain, value: string) => {
    setExtraDomains(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const handleRemoveDomain = (index: number) => {
    setExtraDomains(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append('domains', JSON.stringify(extraDomains));

    const result = await createOrganization(formData);

    if (result.error) {
      alert(result.error);
    } else {
      setOpen(false);
      setExtraDomains([]);
      onComplete();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
        <Plus className="h-4 w-4 mr-2" />
        Yeni Organizasyon
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Yeni Organizasyon Ekle</DialogTitle>
          <DialogDescription>
            Üniversite bilgilerini ve e-posta alan adlarını tanımlayın.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Organizasyon Adı</Label>
            <Input id="name" name="name" required placeholder="Örn: İstanbul Teknik Üniversitesi" className="bg-background" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primaryDomain">Ana Domain (Student)</Label>
              <Input id="primaryDomain" name="primaryDomain" required placeholder="itu.edu.tr" className="bg-background" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select name="plan" defaultValue="trial">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxStudents">Öğrenci Limiti (Sınırsız için boş bırakın)</Label>
            <Input id="maxStudents" name="maxStudents" type="number" placeholder="Örn: 500" className="bg-background" />
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-2">
              <Label>Ek Alan Adları (Hoca vs.)</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddDomain} className="h-8">
                <Plus className="h-3 w-3 mr-1" /> Ekle
              </Button>
            </div>

            {extraDomains.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Ek alan adı tanımlanmadı. Sadece ana domain geçerli olacak.</p>
            ) : (
              <div className="space-y-3">
                {extraDomains.map((d, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      placeholder="isikun.edu.tr"
                      value={d.domain}
                      onChange={(e) => handleDomainChange(index, 'domain', e.target.value)}
                      className="flex-1 bg-background"
                      required
                    />
                    <Select value={d.role_hint} onValueChange={(val) => val && handleDomainChange(index, 'role_hint', val)}>
                      <SelectTrigger className="w-[130px] bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="instructor">Instructor</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="any">Any (Hepsi)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveDomain(index)} className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>İptal</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Kaydet
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
