import { getOrgSettings } from '../actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ShieldAlert, Loader2 } from 'lucide-react';

export default async function AdminSettingsPage() {
  const data = await getOrgSettings();

  if (data?.error) {
    return <div className="p-8 text-red-500">Hata: {data.error}</div>;
  }

  const { organization, domains } = data as any;

  return (
    <div className="p-8">
      <div className="max-w-4xl">
        <div className="mb-6">
          <Link href="/dashboard/admin" className="text-gray-400 hover:text-white flex items-center text-sm w-fit mb-4 transition-colors">
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
          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Genel Bilgiler</CardTitle>
              <CardDescription>Okulunuzun sistemde kayıtlı olan temel bilgileri.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Kurum Adı</label>
                  <div className="bg-background px-4 py-2 rounded-md border border-border text-foreground">
                    {organization.name}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Durum</label>
                  <div className="px-4 py-2 flex items-center">
                    {organization.status === 'active' ? (
                      <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-normal text-sm">
                        <CheckCircle2 className="w-4 h-4 mr-1.5" /> Aktif
                      </Badge>
                    ) : organization.status === 'suspended' ? (
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20 font-normal text-sm">
                        <ShieldAlert className="w-4 h-4 mr-1.5" /> Askıda
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-normal text-sm">
                        <Loader2 className="w-4 h-4 mr-1.5" /> Deneme Sürümü
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Lisans & Plan Detayları</CardTitle>
              <CardDescription>Mevcut CampusFlow lisans kapasiteniz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Aktif Plan</label>
                  <div className="bg-background px-4 py-2 rounded-md border border-border text-foreground capitalize flex items-center">
                    {organization.plan} Plan
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground block mb-1">Öğrenci Kapasitesi</label>
                  <div className="bg-background px-4 py-2 rounded-md border border-border text-foreground">
                    {organization.max_students ? `${organization.max_students} Öğrenci` : 'Sınırsız (Limit Yok)'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Kayıtlı Alan Adları (Domains)</CardTitle>
              <CardDescription>Bu alan adlarına sahip kişiler okulunuza otomatik olarak katılabilir.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {domains && domains.map((domain: any) => (
                  <div key={domain.id} className="flex items-center justify-between bg-background px-4 py-3 rounded-md border border-border">
                    <span className="text-foreground font-medium">@{domain.domain}</span>
                    <Badge variant="outline" className="text-muted-foreground bg-muted/50 border-border font-normal">
                      Varsayılan Rol: {domain.role_hint === 'any' ? 'Sisteme Bırak' : domain.role_hint}
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
