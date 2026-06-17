'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export async function loginWithPasswordAndOTP(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email?.endsWith('.edu.tr') && email !== 'ogulcankacarr@gmail.com') {
    return { error: 'Sadece .edu.tr uzantılı e-posta adresleri kullanılabilir.' };
  }

  const supabase = await createClient();

  const domain = email.split('@')[1];
  if (email !== 'ogulcankacarr@gmail.com') {
    const { data: domainInfo, error: domainError } = await supabase
      .rpc('check_domain_status', { p_domain: domain })
      .single<{ organization_status: string }>();

    if (domainError || !domainInfo) {
      return { error: `Okulunuz (${domain}) henüz CampusFlow sistemine kayıtlı değil.` };
    }

    if (domainInfo.organization_status === 'suspended') {
      return { error: `Okulunuz (${domain}) sistem yöneticisi tarafından askıya alınmıştır. Sisteme giriş yapamazsınız.` };
    }
  }
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
      .single<{ organization_status: string }>();

    if (error || !domainInfo) {
      return { error: `Okulunuz (${domain}) henüz CampusFlow sistemine kayıtlı değil.` };
    }

    if (domainInfo.organization_status === 'suspended') {
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
  const { error } = await supabase.auth.verifyOtp({
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

export async function sendPasswordResetEmail() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return { error: 'Kullanıcı bulunamadı.' };

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });
  
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateProfile(fullName: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: fullName }
  });
  
  if (error) return { error: error.message };
  return { success: true };
}

export async function updateUserPassword(password: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password
  });
  
  if (error) return { error: error.message };
  return { success: true };
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string;
  if (!email) return { error: 'E-posta adresi gereklidir.' };

  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  });
  
  if (error) return { error: error.message };
  return { success: true };
}
