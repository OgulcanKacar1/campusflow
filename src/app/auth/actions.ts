'use server';

import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

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

  // 1. Şifreyi doğrula (Ama cookie set etme, yani henüz sisteme sokma)
  const dummySupabase = createDummyClient();
  const { error: passwordError } = await dummySupabase.auth.signInWithPassword({
    email,
    password,
  });

  if (passwordError) {
    return { error: 'E-posta veya şifre hatalı.' };
  }

  // 2. Şifre doğruysa asıl client ile mailine OTP gönder.
  const supabase = await createClient();
  const { error: otpError } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false, // Login olduğu için yeni user oluşturma
    },
  });

  if (otpError) {
    return { error: 'Doğrulama kodu gönderilirken bir hata oluştu: ' + otpError.message };
  }

  return { success: true, step: 'otp', email };
}

export async function registerWithPassword(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const fullName = formData.get('full_name') as string;

  if (!email?.endsWith('.edu.tr') && email !== 'ogulcankacarr@gmail.com') {
    return { error: 'Sadece .edu.tr uzantılı e-posta adresleri kayıt olabilir.' };
  }

  const supabase = await createClient();
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

  // Kayıt başarılıysa Supabase otomatik OTP gönderir.
  return { success: true, step: 'otp', email };
}

export async function verifyOTP(formData: FormData) {
  const email = formData.get('email') as string;
  const token = formData.get('code') as string;
  const type = formData.get('type') as 'email' | 'signup'; // 'email' for login, 'signup' for register

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type,
  });

  if (error) {
    return { error: 'Kod hatalı veya süresi dolmuş.' };
  }

  return { success: true };
}
