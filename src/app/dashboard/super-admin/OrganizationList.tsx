'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, ShieldAlert, CheckCircle2, Play, Pause, Loader2, Search } from 'lucide-react';
import { createOrganization, updateOrganizationStatus, updateOrganizationDetails } from './actions';

type Organization = {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'suspended' | 'trial';
  plan: string;
  max_students: number | null;
  domains: Array<{ domain: string; role_hint: string }>;
};

type Props = {
  organizations: Organization[];
};

export default function OrganizationList({ organizations }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [extraDomains, setExtraDomains] = useState<Array<{ domain: string; role_hint: string }>>([]);
  
  // Arama ve filtre state'leri
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrganizations = useMemo(() => {
    return organizations.filter(org => {
      // Durum filtrelemesi
      if (statusFilter !== 'all' && org.status !== statusFilter) {
        return false;
      }
      
      // Arama filtrelemesi (isim veya alan adlarında)
      if (search.trim() !== '') {
        const term = search.toLowerCase();
        const matchesName = org.name.toLowerCase().includes(term);
        const matchesDomain = org.domains?.some(d => d.domain.toLowerCase().includes(term));
        if (!matchesName && !matchesDomain) {
          return false;
        }
      }
      
      return true;
    });
  }, [organizations, search, statusFilter]);

  const handleAddExtraDomain = () => {
    setExtraDomains([...extraDomains, { domain: '', role_hint: 'student' }]);
  };

  const handleExtraDomainChange = (index: number, field: 'domain' | 'role_hint', value: string) => {
    const newDomains = [...extraDomains];
    newDomains[index][field] = value;
    setExtraDomains(newDomains);
  };

  const handleRemoveExtraDomain = (index: number) => {
    setExtraDomains(extraDomains.filter((_, i) => i !== index));
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
      setIsOpen(false);
      setExtraDomains([]);
    }
    
    setLoading(false);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingOrg) return;
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await updateOrganizationDetails(editingOrg.id, formData);
    
    if (result.error) {
      alert(result.error);
    } else {
      setIsEditOpen(false);
      setEditingOrg(null);
    }
    
    setLoading(false);
  };

  const handleStatusToggle = async (org: Organization) => {
    const newStatus = org.status === 'active' ? 'suspended' : 'active';
    if (confirm(`${org.name} organizasyonunu ${newStatus === 'active' ? 'aktif etmek' : 'askıya almak'} istediğinize emin misiniz?`)) {
      const result = await updateOrganizationStatus(org.id, newStatus);
      if (result.error) alert(result.error);
    }
  };

  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-foreground">Üniversiteler & Organizasyonlar</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Sisteme kayıtlı tüm organizasyonları ve alan adlarını yönetin.
          </CardDescription>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
                  <Button type="button" variant="outline" size="sm" onClick={handleAddExtraDomain} className="h-8">
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
                          onChange={(e) => handleExtraDomainChange(index, 'domain', e.target.value)}
                          className="flex-1 bg-background"
                          required
                        />
                        <Select 
                          value={d.role_hint} 
                          onValueChange={(val) => handleExtraDomainChange(index, 'role_hint', val)}
                        >
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
                        <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveExtraDomain(index)} className="text-red-400 hover:text-red-300 hover:bg-red-950/30">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>İptal</Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kaydet
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground">
            <DialogHeader>
              <DialogTitle>Organizasyonu Düzenle</DialogTitle>
              <DialogDescription>
                Organizasyon adı, planı ve öğrenci limitini güncelleyebilirsiniz.
              </DialogDescription>
            </DialogHeader>
            {editingOrg && (
              <form onSubmit={handleEditSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Organizasyon Adı</Label>
                  <Input id="edit-name" name="name" required defaultValue={editingOrg.name} className="bg-background" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Plan</Label>
                    <Select name="plan" defaultValue={editingOrg.plan}>
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
                    <Input id="edit-maxStudents" name="maxStudents" type="number" defaultValue={editingOrg.max_students || ''} placeholder="Sınırsız için boş bırakın" className="bg-background" />
                  </div>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)} disabled={loading}>İptal</Button>
                  <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Güncelle
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-[400px]">
            <TabsList className="bg-background/50 border border-border">
              <TabsTrigger value="all">Tümü</TabsTrigger>
              <TabsTrigger value="active">Aktif</TabsTrigger>
              <TabsTrigger value="suspended">Askıda</TabsTrigger>
              <TabsTrigger value="trial">Deneme</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Üniversite veya domain ara..."
              className="w-full bg-background pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Organizasyon</TableHead>
                <TableHead>Alan Adları</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {search ? 'Aramaya uygun organizasyon bulunamadı.' : 'Henüz hiç organizasyon bulunmuyor.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">{org.name}</div>
                      <div className="text-xs text-muted-foreground">Max Öğrenci: {org.max_students ?? 'Sınırsız'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {org.domains?.map((d, i) => (
                          <Badge key={i} variant="outline" className="bg-background text-xs font-normal">
                            @{d.domain} <span className="text-muted-foreground ml-1 opacity-70">({d.role_hint})</span>
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{org.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      {org.status === 'active' ? (
                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-normal">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Aktif
                        </Badge>
                      ) : org.status === 'suspended' ? (
                        <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-normal">
                          <ShieldAlert className="w-3 h-3 mr-1" /> Askıda
                        </Badge>
                      ) : (
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-normal">
                          <Loader2 className="w-3 h-3 mr-1" /> Deneme
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setEditingOrg(org);
                          setIsEditOpen(true);
                        }}
                        className="mr-2"
                      >
                        Düzenle
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleStatusToggle(org)}
                        className={org.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'}
                      >
                        {org.status === 'active' ? (
                          <><Pause className="w-4 h-4 mr-1" /> Askıya Al</>
                        ) : (
                          <><Play className="w-4 h-4 mr-1" /> Aktif Et</>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
