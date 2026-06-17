import { getAdminDashboardStats, getOrgUsers } from './actions';
import Link from 'next/link';
import { Users, Settings, GraduationCap, BookOpen, UserPlus, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default async function AdminDashboard() {
  const data = await getAdminDashboardStats();
  
  if (data?.error) {
    return <div className="p-8 text-destructive">Hata: {data.error}</div>;
  }

  const stats = data?.stats || { students: 0, instructors: 0, activeCourses: 0 };
  const org = data?.organization;

  // Son Eklenen Kullanıcıları Getir
  const { data: usersData } = await getOrgUsers();
  const recentUsers = (usersData || [])
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const usagePercent = org?.max_students ? Math.min(100, Math.round((stats.students / org.max_students) * 100)) : 0;

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Okul Admin Paneli</h1>
          <p className="text-muted-foreground mt-2">
            <span className="font-medium text-primary">{org?.name}</span> organizasyonunun tüm istatistiklerini ve kullanıcılarını buradan yönetin.
          </p>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-6 shadow-sm hover:border-primary/50 transition-colors group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <GraduationCap className="w-24 h-24 text-primary" />
            </div>
            <div className="flex items-center gap-3 relative z-10">
              <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Toplam Öğrenci</p>
            </div>
            <div className="flex items-baseline gap-2 mt-2 relative z-10">
              <p className="text-foreground text-3xl font-bold tracking-tight">{stats.students}</p>
              {org?.max_students && (
                <p className="text-sm text-muted-foreground">/ {org.max_students} limit</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-6 shadow-sm hover:border-primary/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-secondary/20 group-hover:bg-secondary/30 transition-colors">
                <Users className="w-5 h-5 text-secondary-foreground" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Toplam Hoca</p>
            </div>
            <p className="text-foreground text-3xl font-bold mt-2 tracking-tight">{stats.instructors}</p>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border/60 bg-card p-6 shadow-sm hover:border-primary/50 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-muted/60 group-hover:bg-muted transition-colors">
                <BookOpen className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Aktif Ders</p>
            </div>
            <p className="text-foreground text-3xl font-bold mt-2 tracking-tight">{stats.activeCourses}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol Kolon: Hızlı Eylemler ve Lisans */}
          <div className="space-y-6 lg:col-span-1">
            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Lisans Kullanımı</CardTitle>
                <CardDescription>Öğrenci kota durumunuz</CardDescription>
              </CardHeader>
              <CardContent>
                {org?.max_students ? (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-foreground font-medium">{stats.students} Kullanımda</span>
                      <span className="text-muted-foreground">{org.max_students} Toplam</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500 ease-in-out" 
                        style={{ width: `${usagePercent}%` }} 
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {usagePercent >= 90 ? 'Kotanız dolmak üzere! Lütfen planınızı yükseltin.' : 'Mevcut planınız kullanımınız için yeterli.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-emerald-500">Sınırsız Plan</p>
                      <p className="text-xs text-emerald-500/80">Herhangi bir öğrenci kısıtlamanız yok.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/40 border-border/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Hızlı Eylemler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/dashboard/admin/users" className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/40 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-primary/10 text-primary">
                      <UserPlus className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Yeni Kullanıcı Ekle</p>
                      <p className="text-xs text-muted-foreground">Sisteme öğrenci veya hoca davet et</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                </Link>
                <Link href="/dashboard/admin/settings" className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-background/50 hover:bg-muted/40 transition-colors group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-secondary/20 text-secondary-foreground">
                      <Settings className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Okul Ayarları</p>
                      <p className="text-xs text-muted-foreground">Sistem özelliklerini yapılandır</p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors group-hover:translate-x-1" />
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Sağ Kolon: Son Eklenen Kullanıcılar */}
          <div className="lg:col-span-2">
            <Card className="bg-card/40 border-border/50 h-full">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Son Eklenen Kullanıcılar</CardTitle>
                  <CardDescription>Sisteme en son dahil olan öğrenciler ve hocalar</CardDescription>
                </div>
                <Link href="/dashboard/admin/users" className="text-sm text-primary hover:underline font-medium flex items-center gap-1">
                  Tümünü Gör
                </Link>
              </CardHeader>
              <CardContent>
                {recentUsers.length > 0 ? (
                  <div className="space-y-4 mt-2">
                    {recentUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted/50 border border-border/50 flex items-center justify-center">
                            <span className="text-sm font-bold text-muted-foreground">
                              {u.full_name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge variant="outline" className={u.role === 'instructor' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-muted text-muted-foreground'}>
                            {u.role === 'instructor' ? 'Hoca' : 'Öğrenci'}
                          </Badge>
                          <div className="hidden sm:flex items-center text-xs text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            {new Date(u.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground border border-dashed border-border/50 rounded-xl bg-background/20">
                    Henüz organizasyonunuza kayıtlı bir kullanıcı bulunmuyor.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
