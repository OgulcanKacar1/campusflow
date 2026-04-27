import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Oturumu yeniler ve kullanıcıyı alır
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // Eğer kullanıcı giriş yapmamışsa ve korumalı bir sayfaya girmeye çalışıyorsa login'e at
  if (!user && !pathname.startsWith('/login') && !pathname.startsWith('/auth')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Kullanıcı giriş yapmışsa
  if (user) {
    // Login sayfasına gitmeye çalışırsa engelle
    if (pathname.startsWith('/login')) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }

    // Sadece /dashboard/... altındaki sayfalar için detaylı rol kontrolü yapalım
    if (pathname.startsWith('/dashboard/')) {
      // /dashboard (kök dizin) için yönlendirmeyi app/dashboard/page.tsx yapıyor. 
      // Biz sadece alt sayfalar (ör: /dashboard/student) için koruma sağlayacağız.
      const pathSegments = pathname.split('/').filter(Boolean);
      
      // Eğer /dashboard/ROLE gibi bir sayfadaysak (en az 2 segment varsa)
      if (pathSegments.length >= 2) {
        const attemptedRoleSection = pathSegments[1]; // 'super-admin', 'admin', 'instructor', 'student'

        // Rolü çek
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profile) {
          let userRolePath = profile.role;
          // 'super_admin' olan rolümüz URL'de 'super-admin' olarak geçiyor
          if (userRolePath === 'super_admin') userRolePath = 'super-admin';

          // Girmeye çalıştığı sayfa kendi rolüyle uyuşmuyor mu?
          if (attemptedRoleSection !== userRolePath) {
            const url = request.nextUrl.clone();
            url.pathname = `/dashboard/${userRolePath}`;
            return NextResponse.redirect(url);
          }
        }
      }
    }
  }

  return supabaseResponse
}
