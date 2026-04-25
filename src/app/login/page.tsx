'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithPasswordAndOTP, registerWithPassword, verifyOTP } from '@/app/auth/actions';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, Lock, KeyRound, ArrowRight } from 'lucide-react';

type AuthMode = 'login' | 'register' | 'otp';

export default function LoginPage() {
  const router = useRouter();
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
    
    if (mode === 'login' || mode === 'register') {
      setEmail(formEmail);
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
        // formData still contains 'code', but we need to inject 'email' and 'type'
        formData.append('email', email);
        // If we came from register, type is 'signup', else 'email' (for login magic link)
        formData.append('type', 'email'); // For simplicity, we assume 'email'. In a real app, track the previous mode.
        const result = await verifyOTP(formData);
        if (result?.error) throw new Error(result.error);
        if (result?.success) {
          router.push('/dashboard'); // Başarılı girişte yönlendirme
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center relative overflow-hidden">
      {/* Arka Plan Glow Efektleri */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />

      <Card className="w-full max-w-md bg-card/60 backdrop-blur-xl border-border shadow-2xl z-10">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="font-heading text-3xl font-bold tracking-tight text-foreground">
            {mode === 'otp' ? 'Doğrulama Kodu' : mode === 'login' ? 'Tekrar Hoş Geldin' : 'Hesap Oluştur'}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {mode === 'otp' 
              ? `${email} adresine gönderilen 6 haneli kodu girin.`
              : 'CampusFlow platformuna erişmek için .edu.tr mailinizle devam edin.'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-md text-center">
                {error}
              </div>
            )}

            {mode !== 'otp' ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-foreground">Kurumsal E-Posta</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      placeholder="@universite.edu.tr" 
                      required 
                      className="pl-10 bg-input/20 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-foreground">Şifre</Label>
                    {mode === 'login' && (
                      <a href="#" className="text-xs text-primary hover:text-primary/80 transition-colors">
                        Şifremi Unuttum
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input 
                      id="password" 
                      name="password" 
                      type="password" 
                      placeholder="••••••••" 
                      required 
                      className="pl-10 bg-input/20 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="code" className="text-foreground">6 Haneli Kod</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    id="code" 
                    name="code" 
                    type="text" 
                    maxLength={6}
                    placeholder="000000" 
                    required 
                    className="pl-10 text-center tracking-[0.5em] text-lg font-mono bg-input/20 border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-primary"
                  />
                </div>
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 mt-6 h-11"
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : mode === 'otp' ? (
                <>Giriş Yap <ArrowRight className="ml-2 h-4 w-4" /></>
              ) : mode === 'login' ? (
                'Giriş Yap'
              ) : (
                'Kayıt Ol'
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/50 pt-6">
          {mode !== 'otp' && (
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? "Hesabın yok mu? " : "Zaten hesabın var mı? "}
              <button 
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError(null);
                }} 
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {mode === 'login' ? 'Hemen Kayıt Ol' : 'Giriş Yap'}
              </button>
            </p>
          )}
          {mode === 'otp' && (
            <button 
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }} 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              ← Geri Dön
            </button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
