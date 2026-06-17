'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ShieldAlert, CheckCircle2, Play, Pause, Loader2, Search, Building2, Users, Settings } from 'lucide-react';
import type { Organization } from '@/types/organization';
import { CreateOrganizationModal } from '@/components/dashboard/super-admin/CreateOrganizationModal';
import { EditOrganizationModal } from '@/components/dashboard/super-admin/EditOrganizationModal';
import { OrgUsersDialog } from '@/components/dashboard/super-admin/OrgUsersDialog';
import { OrgStatusModal } from '@/components/dashboard/super-admin/OrgStatusModal';

type Props = {
  organizations: Organization[];
};

export default function OrganizationList({ organizations }: Props) {
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [usersOrg, setUsersOrg] = useState<Organization | null>(null);
  const [isUsersOpen, setIsUsersOpen] = useState(false);
  const [statusOrg, setStatusOrg] = useState<Organization | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

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


  return (
    <Card className="bg-card/50 border-border backdrop-blur-sm mt-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold text-foreground">Üniversiteler & Organizasyonlar</CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Sisteme kayıtlı tüm organizasyonları ve alan adlarını yönetin.
          </CardDescription>
        </div>
        
        <CreateOrganizationModal onComplete={() => {}} />
        <EditOrganizationModal
          org={editingOrg}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onComplete={() => setEditingOrg(null)}
        />
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
        <div className="rounded-xl border border-border/50 overflow-hidden bg-background/40 shadow-sm">
          <Table>
            <TableHeader className="bg-muted/30 border-b border-border/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider h-11">Organizasyon</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider h-11">Alan Adları</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider h-11">Plan</TableHead>
                <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider h-11">Durum</TableHead>
                <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider h-11">İşlemler</TableHead>
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
                  <TableRow key={org.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-5 h-5 text-muted-foreground/70" />
                        </div>
                        <div>
                          <div className="font-semibold text-foreground/90">{org.name}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">Max Öğrenci: <span className="text-foreground/70">{org.max_students ?? 'Sınırsız'}</span></div>
                        </div>
                      </div>
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
                      <Badge variant="outline" className="capitalize bg-muted/30 border-border/60 text-muted-foreground">{org.plan}</Badge>
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
                        <Badge className="bg-secondary/20 text-secondary-foreground border-border font-normal">
                          <Loader2 className="w-3 h-3 mr-1" /> Deneme
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setUsersOrg(org); setIsUsersOpen(true); }}
                          className="h-8 border-border/60 bg-background/50 hover:bg-muted/50 hover:text-foreground text-muted-foreground transition-colors"
                        >
                          <Users className="w-3.5 h-3.5 mr-1.5" /> Kullanıcılar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setEditingOrg(org);
                            setIsEditOpen(true);
                          }}
                          className="h-8 border-border/60 bg-background/50 hover:bg-muted/50 hover:text-foreground text-muted-foreground transition-colors"
                        >
                          <Settings className="w-3.5 h-3.5 mr-1.5" /> Düzenle
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => { setStatusOrg(org); setIsStatusOpen(true); }}
                          className={`h-8 border-border/60 bg-background/50 hover:bg-muted/50 transition-colors ${org.status === 'active' ? 'text-red-400/80 hover:text-red-400' : 'text-emerald-400/80 hover:text-emerald-400'}`}
                        >
                          {org.status === 'active' ? (
                            <><Pause className="w-3.5 h-3.5 mr-1.5" /> Askıya Al</>
                          ) : (
                            <><Play className="w-3.5 h-3.5 mr-1.5" /> Aktif Et</>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <OrgUsersDialog
        org={usersOrg}
        open={isUsersOpen}
        onOpenChange={setIsUsersOpen}
      />
      <OrgStatusModal
        org={statusOrg}
        open={isStatusOpen}
        onOpenChange={setIsStatusOpen}
        onComplete={() => setStatusOrg(null)}
      />
    </Card>
  );
}
