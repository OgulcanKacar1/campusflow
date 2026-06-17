'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserCircle } from 'lucide-react';
import { getUsersByOrganization, updateUserRole } from '@/app/dashboard/super-admin/actions';
import type { Organization } from '@/types/organization';
import type { OrgUser } from '@/types/user';

interface Props {
  org: Organization | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrgUsersDialog({ org, open, onOpenChange }: Props) {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open || !org) return;

    let cancelled = false;

    startTransition(() => {
      setLoading(true);
      setUsers([]);
    });

    getUsersByOrganization(org.id).then((result) => {
      if (cancelled) return;
      startTransition(() => {
        if (result.data) setUsers(result.data as OrgUser[]);
        setLoading(false);
      });
    });

    return () => {
      cancelled = true;
    };
  }, [open, org, startTransition]);

  const handleRoleUpdate = async (userId: string, newRole: 'student' | 'instructor' | 'admin') => {
    setRoleUpdateLoading(userId);
    const result = await updateUserRole(userId, newRole);
    if (result.error) {
      alert(result.error);
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    }
    setRoleUpdateLoading(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] bg-card border-border/60 text-foreground shadow-2xl shadow-black">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Kullanıcılar — <span className="text-primary">{org?.name}</span></DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Bu organizasyondaki kullanıcıların rollerini görüntüleyin ve düzenleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[420px] overflow-y-auto mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm bg-muted/10 rounded-xl border border-dashed border-border/50">Bu organizasyonda henüz kayıtlı kullanıcı yok.</p>
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden bg-background/40">
              <Table>
                <TableHeader className="bg-muted/30 border-b border-border/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Kullanıcı</TableHead>
                    <TableHead className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mevcut Rol</TableHead>
                    <TableHead className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rol Değiştir</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map(user => (
                    <TableRow key={user.id} className="border-border/40 hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center flex-shrink-0">
                            <UserCircle className="w-5 h-5 text-muted-foreground/70" />
                          </div>
                          <div>
                            <div className="font-medium text-sm text-foreground/90">{user.full_name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.role === 'admin'
                              ? 'bg-primary/10 text-primary border-primary/20'
                              : user.role === 'instructor'
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                              : 'bg-muted/50 text-muted-foreground border-border/50'
                          }
                        >
                          {user.role === 'admin' ? 'Admin' : user.role === 'instructor' ? 'Hoca' : 'Öğrenci'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {roleUpdateLoading === user.id ? (
                          <Loader2 className="w-4 h-4 animate-spin ml-auto text-primary" />
                        ) : (
                          <Select
                            value={user.role}
                            onValueChange={(val) => val && handleRoleUpdate(user.id, val as 'student' | 'instructor' | 'admin')}
                          >
                            <SelectTrigger className="w-[130px] bg-muted/20 border-border/60 hover:bg-muted/40 transition-colors h-8 text-xs ml-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-border/60">
                              <SelectItem value="student">Öğrenci</SelectItem>
                              <SelectItem value="instructor">Hoca</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
