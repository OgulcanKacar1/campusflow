import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get('teamId');
  const returnUrl = searchParams.get('returnUrl');

  if (!teamId || !returnUrl) {
    return new NextResponse('Eksik parametreler (teamId, returnUrl)', { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new NextResponse('GITHUB_CLIENT_ID tanımlı değil', { status: 500 });
  }

  // State içine geri dönüş yapacağımız rotaları güvenli şekilde saklıyoruz
  const stateObj = { teamId, returnUrl };
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

  // scope=repo: private/public repolara erişim
  // scope=admin:repo_hook: webhook kurulumu için
  const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=repo,admin:repo_hook&state=${state}`;

  return NextResponse.redirect(githubUrl);
}

