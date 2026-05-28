'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

// Cookieleri set etmeyen "dummy" bir client oluşturuyoruz.
// Amacımız şifrenin doğru olup olmadığını kontrol etmek, ama oturumu hemen açmamak.
function createDummyClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false, // Sunucuda oturumu kalıcı yapma
        autoRefreshToken: false,
      }
    }
  );
}

export async function loginWithPasswordAndOTP(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email?.endsWith('.edu.tr') && email !== 'ogulcankacarr@gmail.com') {
    return { error: 'Sadece .edu.tr uzantılı e-posta adresleri kullanılabilir.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: 'E-posta veya şifre hatalı.' };
  }

  // OTP Devre Dışı: Direkt dashboard'a yönlendir
  redirect('/dashboard');
}

export async function registerWithPassword(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;

  if (!email?.endsWith('.edu.tr') && email !== 'ogulcankacarr@gmail.com') {
    return { error: 'Sadece .edu.tr uzantılı e-posta adresleri kayıt olabilir.' };
  }

  const supabase = await createClient();

  const domain = email.split('@')[1];
  if (email !== 'ogulcankacarr@gmail.com') {
    // RLS bypass eden RPC fonksiyonu ile domain ve status kontrolü
    const { data: domainInfo, error } = await supabase
      .rpc('check_domain_status', { p_domain: domain })
      .single();

    if (error || !domainInfo) {
      return { error: `Okulunuz (${domain}) henüz CampusFlow sistemine kayıtlı değil.` };
    }

    if ((domainInfo as any).organization_status === 'suspended') {
      return { error: `Okulunuz (${domain}) şu anda kayıtlara kapalıdır. Lütfen yönetimle iletişime geçin.` };
    }
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Development'ta mail doğrulaması atla, production'da OTP sayfasına yönlendir
  if (process.env.NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION === 'true') {
    redirect('/dashboard');
  }

  redirect(`/login?mode=otp&email=${encodeURIComponent(email)}`);
}

export async function verifyOTP(formData: FormData) {
  const email = formData.get('email') as string;
  const token = formData.get('code') as string;
  const type = formData.get('type') as 'email' | 'signup';

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  });

  if (error) {
    return { error: 'Kod hatalı veya süresi dolmuş.' };
  }

  // Cookie'ler server action içinde set edildi, artık güvenle yönlendiriyoruz.
  // Client-side router.push() yerine server-side redirect() kullanıyoruz.
  // Bu, cookie'lerin tarayıcıya doğru iletilmesini garanti eder.
  redirect('/dashboard');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
