'use client';

import { useState } from 'react';
import { User, Mail, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { updateProfile, sendPasswordResetEmail } from '@/app/auth/actions';

interface ProfileSettingsClientProps {
  initialFullName: string;
  email: string;
}

export const ProfileSettingsClient = ({ initialFullName, email }: ProfileSettingsClientProps) => {
  const [fullName, setFullName] = useState(initialFullName);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState('');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);

    const res = await updateProfile(fullName);
    setSavingProfile(false);

    if (res.success) {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
  };

  const handleResetPassword = async () => {
    setSendingEmail(true);
    setEmailSuccess(false);
    setEmailError('');

    const res = await sendPasswordResetEmail();
    setSendingEmail(false);

    if (res.success) {
      setEmailSuccess(true);
    } else {
      setEmailError(res.error || 'Bir hata oluştu.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Ayarlar</h1>
        <p className="text-muted-foreground text-sm">Kişisel bilgilerinizi ve güvenlik ayarlarınızı buradan yönetebilirsiniz.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sol Kolon: Kişisel Bilgiler & E-posta */}
        <div className="flex flex-col gap-8">
          <div className="bg-card/40 backdrop-blur-xl border border-border/40 shadow-xl shadow-black/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <User className="text-primary w-5 h-5" /> Kişisel Bilgiler
            </h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-2">
                  Ad Soyad
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-background/40 border border-border/50 rounded-lg px-4 py-2.5 text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all"
                />
              </div>
              <div className="pt-2 flex items-center justify-between">
                {profileSuccess ? (
                  <span className="text-emerald-400 text-xs font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Güncellendi
                  </span>
                ) : <span />}
                <button
                  type="submit"
                  disabled={savingProfile || fullName === initialFullName}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-lg shadow-md shadow-primary/20 transition-all disabled:opacity-50 flex items-center"
                >
                  {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Kaydet
                </button>
              </div>
            </form>
          </div>

          <div className="bg-card/40 backdrop-blur-xl border border-border/40 shadow-xl shadow-black/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Mail className="text-primary w-5 h-5" /> E-Posta Adresi
            </h2>
            <div>
              <label className="block text-xs font-bold tracking-widest uppercase text-muted-foreground mb-2">
                Kurumsal E-Posta
              </label>
              <input
                type="email"
                disabled
                value={email}
                className="w-full bg-background/20 border border-border/20 rounded-lg px-4 py-2.5 text-muted-foreground text-sm cursor-not-allowed opacity-70"
              />
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                E-posta adresiniz okuldaki (.edu.tr) kurumunuzla eşleştiği için güvenlik sebebiyle doğrudan değiştirilemez. Değişiklik talepleri için sistem yöneticisiyle görüşün.
              </p>
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Güvenlik / Şifre */}
        <div className="flex flex-col gap-8">
          <div className="bg-card/40 backdrop-blur-xl border border-border/40 shadow-xl shadow-black/20 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="text-primary w-5 h-5" /> Şifre İşlemleri
            </h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Şifrenizi sıfırlamak için mevcut e-posta adresinize bir bağlantı gönderebiliriz. Linke tıkladıktan sonra yeni şifrenizi belirleyebilirsiniz.
              </p>

              {emailSuccess ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl text-sm flex items-start gap-3 mt-4">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-bold mb-1">E-posta Gönderildi</p>
                    <p className="text-emerald-400/80 text-xs">Lütfen gelen kutunuzu kontrol edin. (Local ortamdaysanız Inbucket üzerinden kontrol edin).</p>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  {emailError && (
                    <div className="text-red-400 text-xs mb-3 bg-red-500/10 p-2 rounded border border-red-500/20">
                      {emailError}
                    </div>
                  )}
                  <button
                    onClick={handleResetPassword}
                    disabled={sendingEmail}
                    className="w-full bg-secondary/30 hover:bg-secondary/50 text-foreground font-bold uppercase tracking-widest text-[11px] px-5 py-3.5 rounded-xl border border-secondary/50 shadow-sm transition-all disabled:opacity-50 flex items-center justify-center"
                  >
                    {sendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Şifre Sıfırlama Bağlantısı Gönder
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
