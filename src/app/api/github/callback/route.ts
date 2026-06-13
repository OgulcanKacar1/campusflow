import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateParam = searchParams.get('state');

  if (!code || !stateParam) {
    return new NextResponse('Eksik code veya state', { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new NextResponse('GitHub credentials tanımlı değil', { status: 500 });
  }

  try {
    // State'i çöz
    const stateJson = Buffer.from(stateParam, 'base64').toString('utf-8');
    const { teamId, returnUrl } = JSON.parse(stateJson);

    // GitHub'dan Token al
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('Token Data Error:', tokenData);
      return new NextResponse('Token alınamadı. Lütfen GitHub App ayarlarını kontrol edin.', { status: 400 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase env vars missing for service role');
      return new NextResponse('Sunucu ayar hatası.', { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Veritabanına kaydet (RLS bypass için admin client kullanılır)
    const { error } = await supabaseAdmin
      .from('github_connections')
      .upsert({
        team_id: teamId,
        repo_full_name: 'baglanildi', // MVP için şimdilik bağlantı kurulduğunu temsil eder, daha sonra repo seçilebilir
        access_token: accessToken,
        updated_at: new Date().toISOString()
      }, { onConflict: 'team_id' });

    if (error) {
      console.error('DB Kayıt Hatası:', error);
      return new NextResponse('Veritabanı Hatası: ' + JSON.stringify(error), { status: 500 });
    }

    // Başarıyla kaydedildi, kullanıcıyı geldiği adrese yönlendir
    const redirectUrl = new URL(returnUrl, request.url);
    redirectUrl.searchParams.set('github_connected', 'true');
    return NextResponse.redirect(redirectUrl);
  } catch (err) {
    console.error('Callback hatası:', err);
    return new NextResponse('Bir hata oluştu.', { status: 500 });
  }
}

