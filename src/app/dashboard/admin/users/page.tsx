'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Search, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { getOrgUsers, updateOrgUserRole } from '../actions';
import type { OrgUser } from '@/types/user';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleUpdateLoading, setRoleUpdateLoading] = useState<string | null>(null);

  // Filtreler
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const result = await getOrgUsers();
    if (result.data) {
      setUsers(result.data as OrgUser[]);
    }
    setLoading(false);
  }

  const handleRoleUpdate = async (userId: string, newRole: 'student' | 'instructor') => {
    setRoleUpdateLoading(userId);
    const result = await updateOrgUserRole(userId, newRole);
    if (result.error) {
      alert(result.error);
    } else {
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
    }
    setRoleUpdateLoading(null);
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      // Rol filtresi
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;

      // Arama filtresi
      if (search.trim() !== '') {
        const term = search.toLowerCase();
        const matchesName = u.full_name?.toLowerCase().includes(term);
        const matchesEmail = u.email?.toLowerCase().includes(term);
        if (!matchesName && !matchesEmail) return false;
      }

      return true;
    });
  }, [users, search, roleFilter]);

  return (
    <div className="p-8">
      <div className="max-w-6xl">
        <div className="mb-6">
          <Link href="/dashboard/admin" className="text-gray-400 hover:text-white flex items-center text-sm w-fit mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Admin Paneline Dön
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Kullanıcı Yönetimi</h1>
          <p className="text-gray-400">
            Üniversitene kayıtlı olan tüm öğrencileri ve hocaları buradan görebilir, rollerini değiştirebilirsin.
          </p>
        </div>

        <Card className="bg-card/50 border-border backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <Tabs value={roleFilter} onValueChange={setRoleFilter} className="w-full sm:w-auto">
                <TabsList className="bg-background/50 border border-border w-full justify-start">
                  <TabsTrigger value="all">Tümü</TabsTrigger>
                  <TabsTrigger value="student">Öğrenciler</TabsTrigger>
                  <TabsTrigger value="instructor">Hocalar</TabsTrigger>
                  <TabsTrigger value="admin">Adminler</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="İsim veya e-posta ara..."
                  className="w-full bg-background pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border border-border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Ad Soyad</TableHead>
                    <TableHead>E-posta</TableHead>
                    <TableHead>Mevcut Rol</TableHead>
                    <TableHead className="text-right">Rol İşlemleri</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        {search ? 'Aramaya uygun kullanıcı bulunamadı.' : 'Henüz bu okulda kayıtlı kullanıcı yok.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map(user => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium text-foreground">{user.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              user.role === 'admin' || user.role === 'super_admin'
                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/20 font-normal'
                                : user.role === 'instructor'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 font-normal'
                                : 'bg-muted text-muted-foreground font-normal border-border'
                            }
                          >
                            {user.role === 'admin' || user.role === 'super_admin' ? 'Admin' : user.role === 'instructor' ? 'Hoca' : 'Öğrenci'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {user.role === 'admin' || user.role === 'super_admin' ? (
                            <span className="text-xs text-muted-foreground italic">Değiştirilemez</span>
                          ) : roleUpdateLoading === user.id ? (
                            <Loader2 className="w-4 h-4 animate-spin ml-auto" />
                          ) : (
                            <Select
                              value={user.role}
                              onValueChange={(val) => handleRoleUpdate(user.id, val as 'student' | 'instructor')}
                            >
                              <SelectTrigger className="w-[130px] bg-background h-8 text-xs ml-auto">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="student">Öğrenci</SelectItem>
                                <SelectItem value="instructor">Hoca</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
