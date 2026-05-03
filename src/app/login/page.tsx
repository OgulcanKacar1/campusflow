'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginWithPasswordAndOTP, registerWithPassword, verifyOTP } from '@/app/auth/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, KeyRound, ArrowRight, User, Sparkles, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

type AuthMode = 'login' | 'register' | 'otp';

export default function LoginPage() {
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;
    
    if (mode === 'login' || mode === 'register') {
      setEmail(formEmail);
    }

    if (mode === 'register' && password !== confirmPassword) {
      setError('Şifreler eşleşmiyor.');
      setLoading(false);
      return;
    }

    try {
      if (mode === 'login') {
        const result = await loginWithPasswordAndOTP(formData);
        if (result?.error) throw new Error(result.error);
        if (result?.step === 'otp') setMode('otp');
      } else if (mode === 'register') {
        const result = await registerWithPassword(formData);
        if (result?.error) throw new Error(result.error);
        if (result?.step === 'otp') setMode('otp');
      } else if (mode === 'otp') {
        formData.append('email', email);
        formData.append('type', 'email');
        const result = await verifyOTP(formData);
        if (result?.error) throw new Error(result.error);
      }
    } catch (err: any) {
      if (err?.digest?.startsWith('NEXT_REDIRECT')) {
        throw err;
      }
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#030303] text-white flex items-center justify-center relative overflow-hidden font-sans antialiased">
      {/* Background Effects matching landing page */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-600/10 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Logo and Back Button */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold group-hover:bg-white/20 transition-colors">C</div>
            <span className="text-lg font-bold tracking-tight">CampusFlow</span>
          </Link>
          <Link href="/" className="text-sm text-white/40 hover:text-white flex items-center gap-1 transition-colors">
            <ChevronLeft className="w-4 h-4" /> Ana Sayfa
          </Link>
        </motion.div>

        {/* Auth Card Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative perspective-1000"
        >
          <div className={`w-full duration-700 preserve-3d relative transition-transform min-h-[580px] ${mode === 'register' ? 'rotate-y-180' : ''}`}>
            
            {/* FRONT FACE: Login & OTP */}
            <div className="absolute inset-0 backface-hidden w-full h-full">
              <div className="h-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-[32px] p-8 flex flex-col shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none" />
                
                <div className="mb-8">
                  <h1 className="text-3xl font-bold tracking-tight mb-2 text-white">
                    {mode === 'otp' ? 'Doğrulama' : 'Tekrar Hoş Geldin'}
                  </h1>
                  <p className="text-white/40 text-sm leading-relaxed">
                    {mode === 'otp' 
                      ? `${email} adresine gönderilen kodu girin.`
                      : 'CampusFlow platformuna erişmek için devam edin.'}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 flex-1">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-center font-medium"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {mode === 'login' && (
                    <>
                      <div className="space-y-2 text-left">
                        <Label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">E-Posta</Label>
                        <div className="relative group">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                          <Input 
                            name="email" 
                            type="email" 
                            placeholder="@universite.edu.tr" 
                            required 
                            className="h-12 pl-12 bg-white/5 border-white/[0.05] rounded-2xl focus:bg-white/10 focus:border-purple-500/50 transition-all text-white placeholder:text-white/10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2 text-left">
                        <div className="flex items-center justify-between px-1">
                          <Label className="text-xs font-bold text-white/30 uppercase tracking-widest">Şifre</Label>
                          <Link href="#" className="text-xs text-purple-400 hover:text-purple-300 transition-colors">
                            Şifremi Unuttum
                          </Link>
                        </div>
                        <div className="relative group">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                          <Input 
                            name="password" 
                            type="password" 
                            placeholder="••••••••" 
                            required 
                            className="h-12 pl-12 bg-white/5 border-white/[0.05] rounded-2xl focus:bg-white/10 focus:border-purple-500/50 transition-all text-white placeholder:text-white/10"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {mode === 'otp' && (
                    <div className="space-y-2 mt-4 text-left">
                      <Label className="text-xs font-bold text-white/30 uppercase tracking-widest ml-1">Doğrulama Kodu</Label>
                      <div className="relative group">
                        <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/20 group-focus-within:text-purple-400 transition-colors" />
                        <Input 
                          name="code" 
                          type="text" 
                          maxLength={8}
                          placeholder="••••••••" 
                          required 
                          className="h-14 pl-12 text-center tracking-[0.6em] text-xl font-mono bg-white/5 border-white/[0.05] rounded-2xl focus:bg-white/10 focus:border-purple-500/50 transition-all text-white placeholder:text-white/10"
                        />
                      </div>
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-12 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all active:scale-[0.98] mt-4"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        {mode === 'otp' ? 'Giriş Yap' : 'Devam Et'} <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/[0.05] text-center">
                  <p className="text-sm text-white/40">
                    Hesabın yok mu?{' '}
                    <button 
                      type="button"
                      onClick={() => { setMode('register'); setError(null); }} 
                      className="text-purple-400 hover:text-purple-300 font-bold transition-colors underline underline-offset-4 decoration-purple-500/30"
                    >
                      Hemen Kayıt Ol
                    </button>
                  </p>
                  {mode === 'otp' && (
                    <button 
                      type="button"
                      onClick={() => { setMode('login'); setError(null); }} 
                      className="mt-4 text-xs text-white/20 hover:text-white transition-colors"
                    >
                      ← Geri Dön
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* BACK FACE: Register */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full">
              <div className="h-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] rounded-[32px] p-8 flex flex-col shadow-2xl relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
                
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight mb-2 text-white flex items-center gap-2">
                    Katıl <Sparkles className="w-5 h-5 text-purple-400" />
                  </h1>
                  <p className="text-white/40 text-sm leading-relaxed">
                    Yeni nesil kampüs deneyimine başla.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-center"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Ad Soyad</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                      <Input 
                        name="full_name" 
                        type="text" 
                        placeholder="John Doe" 
                        required 
                        className="h-11 pl-12 bg-white/5 border-white/[0.05] rounded-2xl focus:bg-white/10 focus:border-blue-500/50 transition-all text-white placeholder:text-white/10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">E-Posta</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                      <Input 
                        name="email" 
                        type="email" 
                        placeholder="@universite.edu.tr" 
                        required 
                        className="h-11 pl-12 bg-white/5 border-white/[0.05] rounded-2xl focus:bg-white/10 focus:border-blue-500/50 transition-all text-white placeholder:text-white/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 text-left">
                      <Label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Şifre</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                        <Input 
                          name="password" 
                          type="password" 
                          placeholder="••••" 
                          required 
                          className="h-11 pl-10 bg-white/5 border-white/[0.05] rounded-2xl focus:bg-white/10 focus:border-blue-500/50 transition-all text-white placeholder:text-white/10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 text-left">
                      <Label className="text-[10px] font-black text-white/20 uppercase tracking-widest ml-1">Tekrar</Label>
                      <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-blue-400 transition-colors" />
                        <Input 
                          name="confirm_password" 
                          type="password" 
                          placeholder="••••" 
                          required 
                          className="h-11 pl-10 bg-white/5 border-white/[0.05] rounded-2xl focus:bg-white/10 focus:border-blue-500/50 transition-all text-white placeholder:text-white/10"
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-11 rounded-2xl bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98] mt-2"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Kayıt Ol'}
                  </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-white/[0.05] text-center">
                  <p className="text-sm text-white/40">
                    Zaten hesabın var mı?{' '}
                    <button 
                      type="button"
                      onClick={() => { setMode('login'); setError(null); }} 
                      className="text-blue-400 hover:text-blue-300 font-bold transition-colors underline underline-offset-4 decoration-blue-500/30"
                    >
                      Giriş Yap
                    </button>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer info */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center mt-12 text-[10px] text-white/10 uppercase tracking-[0.2em] italic"
        >
          © 2026 CampusFlow Inc. • Secured by Supabase
        </motion.p>
      </div>
    </div>
  );
}
