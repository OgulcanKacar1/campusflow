import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  // Supabase middleware'ini çağırıyoruz
  return await updateSession(request)
}

export const config = {
  // Sadece bu yollarda (path'lerde) middleware çalışacak.
  // Resimler, CSS dosyaları, _next/static vs. için çalışmasını engelliyoruz ki uygulama hızlı olsun.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
