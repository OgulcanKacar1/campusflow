'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
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

  useEffect(() => {
    if (open && org) {
      setLoading(true);
      setUsers([]);
      getUsersByOrganization(org.id).then(result => {
        if (result.data) setUsers(result.data as OrgUser[]);
        setLoading(false);
      });
    }
  }, [open, org]);

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
      <DialogContent className="sm:max-w-[640px] bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle>Kullanıcılar — {org?.name}</DialogTitle>
          <DialogDescription>
            Bu organizasyondaki kullanıcıların rollerini görüntüleyin ve düzenleyin.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[420px] overflow-y-auto mt-2">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">Bu organizasyonda henüz kayıtlı kullanıcı yok.</p>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Kullanıcı</TableHead>
                  <TableHead>Mevcut Rol</TableHead>
                  <TableHead className="text-right">Rol Değiştir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium text-sm">{user.full_name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          user.role === 'admin'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : user.role === 'instructor'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-muted text-muted-foreground'
                        }
                      >
                        {user.role === 'admin' ? 'Admin' : user.role === 'instructor' ? 'Hoca' : 'Öğrenci'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {roleUpdateLoading === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(val) => val && handleRoleUpdate(user.id, val as 'student' | 'instructor' | 'admin')}
                        >
                          <SelectTrigger className="w-[130px] bg-background h-8 text-xs ml-auto">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
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
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
