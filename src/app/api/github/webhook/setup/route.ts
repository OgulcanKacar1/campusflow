import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 });

  const { teamId } = await request.json();
  if (!teamId) return NextResponse.json({ error: 'teamId eksik' }, { status: 400 });

  // Lider kontrolü
  const { data: member } = await supabase.from('team_members').select('role').eq('team_id', teamId).eq('student_id', user.id).single();
  if (!member || member.role !== 'leader') {
    return NextResponse.json({ error: 'Sadece takım lideri Webhook kurabilir.' }, { status: 403 });
  }

  const admin = createAdminClient();
  
  // Token'ı al
  const { data: connection } = await admin.from('github_connections').select('*').eq('team_id', teamId).single();
  if (!connection || !connection.access_token) {
    return NextResponse.json({ error: 'GitHub bağlantısı bulunamadı. Lütfen önce Takım kartından GitHub yetkisi verin.' }, { status: 400 });
  }

  // Repo URL'yi al
  const { data: team } = await admin.from('teams').select('repo_url').eq('id', teamId).single();
  if (!team || !team.repo_url) {
    return NextResponse.json({ error: 'Lütfen önce yukarıdaki alana GitHub Repo linkinizi kaydedin.' }, { status: 400 });
  }

  // owner ve repo adını çıkar
  const match = team.repo_url.match(/github\.com\/([^\/]+)\/([^\/\.]+)/);
  if (!match) {
    return NextResponse.json({ error: 'Geçersiz GitHub URL formatı. Lütfen geçerli bir repo adresi girin.' }, { status: 400 });
  }
  const owner = match[1];
  const repo = match[2];

  // Request'in geldiği domain'i bul
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  let origin = `${protocol}://${host}`;

  // Eğer localhost ise ve ngrok açıksa, ngrok API'sinden otomatik linki al! (Muazzam Kullanıcı Deneyimi)
  if (origin.includes('localhost')) {
    try {
      const ngrokRes = await fetch('http://127.0.0.1:4040/api/tunnels');
      if (ngrokRes.ok) {
        const ngrokData = await ngrokRes.json();
        const httpsTunnel = ngrokData.tunnels.find((t: any) => t.public_url.startsWith('https'));
        if (httpsTunnel) {
          origin = httpsTunnel.public_url;
        }
      }
    } catch (e) {
      // Ngrok çalışmıyorsa
      return NextResponse.json({ 
        error: 'GitHub, localhost adreslerine Webhook atamaz. Lütfen arka planda Ngrok uygulamasının çalıştığından emin olun.' 
      }, { status: 400 });
    }
  }

  if (origin.includes('localhost')) {
    return NextResponse.json({ 
      error: 'Ngrok linki bulunamadı. Lütfen terminalden Ngrok tünelini açtığınıza emin olun.' 
    }, { status: 400 });
  }

  const webhookUrl = `${origin}/api/webhooks/github?teamId=${teamId}`;
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json({ error: 'Sunucu hatası: GITHUB_WEBHOOK_SECRET tanımlı değil.' }, { status: 500 });
  }

  try {
    // GitHub API ile Webhook kur
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${connection.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'web',
        active: true,
        events: ['push', 'pull_request'],
        config: {
          url: webhookUrl,
          content_type: 'json',
          secret: secret,
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      if (err.errors && err.errors[0]?.message?.includes('Hook already exists')) {
        await admin.from('github_connections').update({ webhook_id: 'existing' }).eq('team_id', teamId);
        return NextResponse.json({ success: true, message: 'Webhook bu repo için zaten kurulu.' });
      }
      return NextResponse.json({ error: 'GitHub API Hatası: ' + (err.message || 'Bilinmeyen hata') }, { status: 400 });
    }

    const data = await response.json();
    
    // Kurulan webhook ID'sini veritabanına kaydet
    await admin.from('github_connections').update({ webhook_id: data.id.toString() }).eq('team_id', teamId);
    
    return NextResponse.json({ success: true, message: 'Webhook başarıyla kuruldu!' });
  } catch (err: any) {
    return NextResponse.json({ error: 'Sunucu hatası: ' + err.message }, { status: 500 });
  }
}
