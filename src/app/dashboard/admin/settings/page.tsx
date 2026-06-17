import { getOrgSettings } from '../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ShieldAlert, Loader2, Building2, CreditCard, Globe, Zap } from 'lucide-react';

export default async function AdminSettingsPage() {
  const result = await getOrgSettings();

  if ('error' in result) {
    return <div className="p-8 text-red-500">Hata: {result.error}</div>;
  }

  const { organization, domains } = result;

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard/admin" className="text-gray-400 hover:text-foreground flex items-center text-sm w-fit mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Admin Paneline Dön
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Okul Ayarları</h1>
          <p className="text-gray-400">
            Kurumunuza ait lisans ve alan adı ayarlarını görüntüleyin. 
            (Değişiklik yapmak için CampusFlow destek ekibiyle iletişime geçmelisiniz.)
          </p>
        </div>

        <div className="grid gap-6 mt-8">
          <Card className="bg-card/40 border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Building2 className="w-48 h-48 text-primary" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-4 h-4 text-primary" />
                </div>
                Genel Bilgiler
              </CardTitle>
              <CardDescription>Okulunuzun sistemde kayıtlı olan temel bilgileri.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Kurum Adı</label>
                  <div className="bg-muted/30 px-4 py-2.5 rounded-lg border border-border/50 text-foreground font-medium flex items-center shadow-sm">
                    {organization.name}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Durum</label>
                  <div className="px-4 py-2.5 flex items-center bg-muted/30 rounded-lg border border-border/50 shadow-sm h-[42px]">
                    {organization.status === 'active' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-normal text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Aktif
                      </Badge>
                    ) : organization.status === 'suspended' ? (
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-normal text-sm">
                        <ShieldAlert className="w-4 h-4 mr-1.5" /> Askıda
                      </Badge>
                    ) : (
                      <Badge className="bg-primary/10 text-primary border-primary/20 font-normal text-sm">
                        <Loader2 className="w-4 h-4 mr-1.5" /> Deneme Sürümü
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CreditCard className="w-48 h-48 text-primary" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <CreditCard className="w-4 h-4 text-secondary-foreground" />
                </div>
                Lisans & Plan Detayları
              </CardTitle>
              <CardDescription>Mevcut CampusFlow lisans kapasiteniz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Aktif Plan</label>
                  <div className="bg-muted/30 px-4 py-2.5 rounded-lg border border-border/50 text-foreground capitalize flex items-center shadow-sm font-medium">
                    <Zap className="w-4 h-4 text-amber-500 mr-2" />
                    {organization.plan} Plan
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground block mb-1.5">Öğrenci Kapasitesi</label>
                  <div className="bg-muted/30 px-4 py-2.5 rounded-lg border border-border/50 text-foreground flex items-center shadow-sm font-medium">
                    {organization.max_students ? `${organization.max_students} Öğrenci` : 'Sınırsız (Limit Yok)'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/40 border-border/50 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Globe className="w-48 h-48 text-primary" />
            </div>
            <CardHeader className="relative z-10">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="p-2 rounded-lg bg-muted/60">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                </div>
                Kayıtlı Alan Adları (Domains)
              </CardTitle>
              <CardDescription>Bu alan adlarına sahip kişiler okulunuza otomatik olarak katılabilir.</CardDescription>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-3">
                {domains.map((domain) => (
                  <div key={domain.id} className="flex items-center justify-between bg-muted/30 px-4 py-3 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors shadow-sm">
                    <span className="text-foreground font-semibold">@{domain.domain}</span>
                    <Badge variant="outline" className="text-muted-foreground bg-background border-border/60 font-normal">
                      Varsayılan Rol: {domain.role_hint === 'any' ? 'Sisteme Bırak' : domain.role_hint === 'instructor' ? 'Hoca' : domain.role_hint === 'student' ? 'Öğrenci' : 'Belirtilmemiş'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
