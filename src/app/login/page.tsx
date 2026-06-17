'use client';

import { useState, useEffect, useTransition } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { loginWithPasswordAndOTP, registerWithPassword, verifyOTP, forgotPassword } from '@/app/auth/actions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, KeyRound, ArrowRight, User, Sparkles, ChevronLeft, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

type AuthMode = 'login' | 'register' | 'otp' | 'forgot_password';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const urlMode = searchParams.get('mode');
    const urlEmail = searchParams.get('email');
    const urlError = searchParams.get('error');

    if (urlError) {
      setError(urlError);
    }

    if (urlMode === 'otp' && urlEmail) {
      startTransition(() => {
        setMode('otp');
        setEmail(decodeURIComponent(urlEmail));
      });
    }
  }, [searchParams, startTransition]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const formEmail = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm_password') as string;
    
    if (mode === 'login' || mode === 'register' || mode === 'forgot_password') {
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
      } else if (mode === 'register') {
        const result = await registerWithPassword(formData);
        if (result?.error) throw new Error(result.error);
      } else if (mode === 'otp') {
        formData.append('email', email);
        formData.append('type', 'email');
        const result = await verifyOTP(formData);
        if (result?.error) throw new Error(result.error);
      } else if (mode === 'forgot_password') {
        const result = await forgotPassword(formData);
        if (result?.error) throw new Error(result.error);
        setSuccessMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen e-postanızı kontrol edin.');
      }
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        'digest' in err &&
        typeof (err as { digest?: string }).digest === 'string' &&
        (err as { digest: string }).digest.startsWith('NEXT_REDIRECT')
      ) {
        throw err;
      }

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Beklenmeyen bir hata oluştu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex items-center justify-center relative overflow-hidden font-sans antialiased">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.02)_0%,transparent_100%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 py-12">
        {/* Logo and Back Button */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center font-bold text-primary group-hover:bg-primary/20 transition-colors shadow-inner">C</div>
            <span className="text-lg font-bold tracking-tight drop-shadow-sm">CampusFlow</span>
          </Link>
          <Link href="/" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
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
            
            {/* FRONT FACE: Login, OTP & Forgot Password */}
            <div className="absolute inset-0 backface-hidden w-full h-full">
              <div className="h-full bg-card/60 backdrop-blur-3xl border border-border/40 rounded-[32px] p-8 flex flex-col shadow-2xl shadow-black/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                
                <div className="mb-8 relative z-10">
                  <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground drop-shadow-sm">
                    {mode === 'otp' ? 'Doğrulama' : mode === 'forgot_password' ? 'Şifremi Unuttum' : 'Tekrar Hoş Geldin'}
                  </h1>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                    {mode === 'otp' 
                      ? `${email} adresine gönderilen kodu girin.`
                      : mode === 'forgot_password'
                      ? 'E-posta adresinizi girin, size sıfırlama bağlantısı gönderelim.'
                      : 'CampusFlow platformuna erişmek için devam edin.'}
                  </p>
                </div>

                {successMessage ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-foreground font-medium">{successMessage}</p>
                    <Button 
                      type="button" 
                      onClick={() => { setMode('login'); setSuccessMessage(null); setError(null); }}
                      className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px]"
                    >
                      Giriş Ekranına Dön
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5 flex-1 relative z-10">
                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-center font-bold"
                        >
                          {error}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {(mode === 'login' || mode === 'forgot_password') && (
                      <div className="space-y-2 text-left">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">E-Posta</Label>
                        <div className="relative group/input">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                          <Input 
                            name="email" 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="@universite.edu.tr" 
                            required 
                            className="h-14 pl-12 bg-background/40 border-border/50 rounded-2xl focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all text-foreground text-sm placeholder:text-muted-foreground/50"
                          />
                        </div>
                      </div>
                    )}

                    {mode === 'login' && (
                      <div className="space-y-2 text-left">
                        <div className="flex items-center justify-between px-1">
                          <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Şifre</Label>
                          <button 
                            type="button"
                            onClick={() => { setMode('forgot_password'); setError(null); }}
                            className="text-[10px] font-bold text-primary/80 hover:text-primary transition-colors uppercase tracking-widest"
                          >
                            Şifremi Unuttum
                          </button>
                        </div>
                        <div className="relative group/input">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                          <Input 
                            name="password" 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            required 
                            className="h-14 pl-12 pr-12 bg-background/40 border-border/50 rounded-2xl focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all text-foreground text-sm placeholder:text-muted-foreground/50"
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )}

                    {mode === 'otp' && (
                      <div className="space-y-2 mt-4 text-left">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Doğrulama Kodu</Label>
                        <div className="relative group/input">
                          <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                          <Input 
                            name="code" 
                            type="text" 
                            maxLength={8}
                            placeholder="••••••••" 
                            required 
                            className="h-16 pl-12 text-center tracking-[0.6em] text-2xl font-mono bg-background/40 border-border/50 rounded-2xl focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all text-foreground placeholder:text-muted-foreground/30"
                          />
                        </div>
                      </div>
                    )}

                    <Button 
                      type="submit" 
                      disabled={loading} 
                      className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-xs shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-4"
                    >
                      {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <span className="flex items-center justify-center gap-2">
                          {mode === 'otp' ? 'Giriş Yap' : mode === 'forgot_password' ? 'Bağlantı Gönder' : 'Devam Et'} <ArrowRight className="w-4 h-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                )}

                <div className="mt-8 pt-6 border-t border-border/40 text-center relative z-10">
                  {mode === 'login' ? (
                    <p className="text-sm font-medium text-muted-foreground">
                      Hesabın yok mu?{' '}
                      <button 
                        type="button"
                        onClick={() => { setMode('register'); setError(null); }} 
                        className="text-primary hover:text-primary/80 font-bold transition-colors underline underline-offset-4 decoration-primary/30"
                      >
                        Hemen Kayıt Ol
                      </button>
                    </p>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => { setMode('login'); setError(null); }} 
                      className="mt-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                    >
                      ← Giriş Ekranına Dön
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* BACK FACE: Register */}
            <div className="absolute inset-0 backface-hidden rotate-y-180 w-full h-full">
              <div className="h-full bg-card/60 backdrop-blur-3xl border border-border/40 rounded-[32px] p-8 flex flex-col shadow-2xl shadow-black/50 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-secondary/10 to-transparent pointer-events-none" />
                
                <div className="mb-6 relative z-10">
                  <h1 className="text-3xl font-bold tracking-tight mb-2 text-foreground flex items-center gap-2 drop-shadow-sm">
                    Katıl <Sparkles className="w-6 h-6 text-primary" />
                  </h1>
                  <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                    Yeni nesil kampüs deneyimine başla.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 flex-1 relative z-10">
                  <AnimatePresence mode="wait">
                    {error && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl text-center font-bold"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Ad Soyad</Label>
                    <div className="relative group/input">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input 
                        name="full_name" 
                        type="text" 
                        placeholder="John Doe" 
                        required 
                        className="h-12 pl-12 bg-background/40 border-border/50 rounded-2xl focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all text-foreground text-sm placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-1 text-left">
                    <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">E-Posta</Label>
                    <div className="relative group/input">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input 
                        name="email" 
                        type="email" 
                        placeholder="@universite.edu.tr" 
                        required 
                        className="h-12 pl-12 bg-background/40 border-border/50 rounded-2xl focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all text-foreground text-sm placeholder:text-muted-foreground/50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 text-left">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Şifre</Label>
                      <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                        <Input 
                          name="password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••" 
                          required 
                          className="h-12 pl-12 pr-10 bg-background/40 border-border/50 rounded-2xl focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all text-foreground text-sm placeholder:text-muted-foreground/50"
                        />
                      </div>
                    </div>
                    <div className="space-y-1 text-left">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1">Tekrar</Label>
                      <div className="relative group/input">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                        <Input 
                          name="confirm_password" 
                          type={showPassword ? "text" : "password"} 
                          placeholder="••••••" 
                          required 
                          className="h-12 pl-12 pr-10 bg-background/40 border-border/50 rounded-2xl focus:ring-1 focus:ring-primary/40 focus:border-primary/50 transition-all text-foreground text-sm placeholder:text-muted-foreground/50"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end pr-1 mt-1">
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                    >
                      {showPassword ? (
                        <><EyeOff className="w-3 h-3" /> Gizle</>
                      ) : (
                        <><Eye className="w-3 h-3" /> Göster</>
                      )}
                    </button>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20 transition-all active:scale-[0.98] mt-2"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Kayıt Ol'}
                  </Button>
                </form>

                <div className="mt-6 pt-4 border-t border-border/40 text-center relative z-10">
                  <p className="text-sm font-medium text-muted-foreground">
                    Zaten hesabın var mı?{' '}
                    <button 
                      type="button"
                      onClick={() => { setMode('login'); setError(null); }} 
                      className="text-primary hover:text-primary/80 font-bold transition-colors underline underline-offset-4 decoration-primary/30"
                    >
                      Giriş Yap
                    </button>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
