'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateUserPassword } from '../actions';
import { Loader2, KeyRound, CheckCircle2 } from 'lucide-react';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }
    
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }

    setLoading(true);
    const res = await updateUserPassword(password);
    setLoading(false);

    if (res.success) {
      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } else {
      setError(res.error || 'Şifre güncellenirken bir hata oluştu.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-card/60 backdrop-blur-3xl border border-border/40 shadow-2xl shadow-black/50 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="text-center mb-8 relative z-10">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <KeyRound className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Yeni Şifre Belirle</h1>
          <p className="text-sm text-muted-foreground mt-2">Lütfen hesabınız için yeni bir şifre girin.</p>
        </div>

        {success ? (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-center gap-3 relative z-10">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-bold">Şifreniz başarıyla güncellendi! Yönlendiriliyorsunuz...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-2">
                Yeni Şifre
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background/40 border border-border/50 rounded-lg px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-2">
                Yeni Şifre (Tekrar)
              </label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full bg-background/40 border border-border/50 rounded-lg px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px] px-5 py-3.5 rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-50 flex items-center justify-center mt-2"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Şifreyi Güncelle
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
