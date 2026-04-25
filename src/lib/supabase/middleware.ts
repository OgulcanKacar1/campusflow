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

  // Eğer kullanıcı giriş yapmamışsa ve korumalı bir sayfaya (login hariç) girmeye çalışıyorsa login'e at
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Eğer kullanıcı giriş yapmışsa ve login sayfasına girmeye çalışıyorsa dashboard'a at
  if (
    user &&
    request.nextUrl.pathname.startsWith('/login')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard' // İleride hocalar ve öğrenciler için ayrı dashboardlara ayrılabilir
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
