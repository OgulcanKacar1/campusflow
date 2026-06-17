'use client';

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Bot, Shield, Users, CheckCircle2, Layout, Sparkles } from 'lucide-react';

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 font-sans overflow-x-hidden antialiased">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-primary/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/20 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.02)_0%,transparent_100%)]" />
      </div>

      {/* Modern Navbar */}
      <nav className="relative z-50 bg-background/20 backdrop-blur-xl border-b border-border/40 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 p-[1px] ring-1 ring-primary/30 flex items-center justify-center">
              <div className="w-full h-full bg-card rounded-[11px] flex items-center justify-center font-bold text-lg text-primary">
                C
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground drop-shadow-sm">
              CampusFlow
            </span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Özellikler</Link>
              <Link href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium">Fiyatlandırma</Link>
            </div>
            <Link 
              href="/login" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px] px-5 py-2.5 rounded-lg shadow-md shadow-primary/20 transition-all flex items-center gap-2"
            >
              Giriş Yap <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold tracking-widest uppercase text-primary mb-10 shadow-[0_0_20px_rgba(var(--primary),0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CampusFlow v3.0 Yayında</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-10 leading-[1.2] text-foreground drop-shadow-md"
          >
            Akademik Hayatı <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-secondary drop-shadow-sm">
              Yeniden Tanımlayın
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base md:text-lg text-muted-foreground mb-14 max-w-2xl mx-auto leading-relaxed"
          >
            Üniversite projelerini, takımları ve dersleri yapay zeka desteğiyle tek bir merkezden yönetin. Modern, hızlı ve izole SaaS deneyimi.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-6"
          >
            <Link 
              href="/login" 
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[13px] px-10 py-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:-translate-y-1 text-center"
            >
              Hemen Başla
            </Link>
            <button className="w-full sm:w-auto px-10 py-4 rounded-xl bg-secondary/30 text-foreground font-bold uppercase tracking-widest text-[13px] hover:bg-secondary/50 transition-all border border-secondary/50 shadow-sm">
              Sistemi İncele
            </button>
          </motion.div>
        </div>

        {/* Elegant Dashboard Mockup Container */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="max-w-6xl mx-auto mt-24 relative"
        >
          <div className="absolute -inset-[2px] bg-gradient-to-r from-primary/30 via-secondary/30 to-primary/30 rounded-[32px] blur-2xl opacity-40" />
          <div className="relative rounded-[30px] bg-card/60 backdrop-blur-3xl border border-border/40 p-2 shadow-2xl shadow-black/50 overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent pointer-events-none" />
            <div className="w-full rounded-[22px] bg-background/80 border border-border/50 relative overflow-hidden flex items-center justify-center">
              <Image 
                src="/campusflow-preview.png" 
                alt="CampusFlow Dashboard Preview" 
                width={1920}
                height={1080}
                className="w-full h-auto object-contain opacity-90 transition-opacity hover:opacity-100 duration-500"
                priority
              />
              
              {/* Cam efekti parlaması */}
              <div className="absolute top-0 left-1/4 w-1/2 h-full bg-white/[0.04] skew-x-[-25deg] transform transition-transform duration-1000 group-hover:translate-x-full z-10 pointer-events-none" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground drop-shadow-sm">Akıllı Çözümler</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">CampusFlow, akademik verimliliği artırmak için geliştirilen son teknoloji araçlarla donatılmıştır.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Bot, title: "AI Notlandırma", desc: "Yapay zeka ile proje kriterlerini analiz edin ve objektif geri bildirimler oluşturun.", gradient: "from-primary/20 to-transparent" },
              { icon: Shield, title: "Güvenli Altyapı", desc: "Her üniversite için tamamen izole veritabanı ve güvenli kimlik doğrulama süreçleri.", gradient: "from-secondary/20 to-transparent" },
              { icon: Users, title: "Takım Yönetimi", desc: "Öğrencileri ilgi alanlarına ve yeteneklerine göre en uygun takımlara yerleştirin.", gradient: "from-primary/20 to-transparent" },
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                custom={i}
                className="group relative p-1 rounded-3xl bg-card/40 backdrop-blur-xl border border-border/40 shadow-xl shadow-black/20 hover:shadow-primary/10 transition-all hover:-translate-y-1"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl`} />
                <div className="relative p-10">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 ring-1 ring-primary/30 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500 shadow-inner">
                    <f.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-4 tracking-tight text-foreground drop-shadow-sm">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6 bg-background/50 backdrop-blur-sm border-y border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-foreground drop-shadow-sm">Esnek Paketler</h2>
            <p className="text-muted-foreground text-lg">Organizasyonunuzun ölçeğine uygun planı seçin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Trial */}
            <div className="p-10 rounded-[32px] bg-card/40 backdrop-blur-xl border border-border/40 shadow-xl shadow-black/20 flex flex-col hover:border-primary/50 transition-all">
              <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-4">Deneme</h3>
              <div className="text-4xl font-bold mb-8 text-foreground">Ücretsiz</div>
              <div className="space-y-5 mb-10 flex-1">
                {["50 Öğrenciye kadar", "3 Eğitmen hesabı", "Temel AI desteği"].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> {item}
                  </div>
                ))}
              </div>
              <button className="w-full bg-secondary/30 hover:bg-secondary/50 text-foreground font-bold uppercase tracking-widest text-[11px] px-5 py-4 rounded-xl border border-secondary/50 shadow-sm transition-all">Denemeye Başla</button>
            </div>

            {/* Premium - Featured */}
            <div className="relative p-12 rounded-[40px] bg-card/60 backdrop-blur-3xl border-2 border-primary/50 flex flex-col shadow-2xl shadow-primary/20 transform md:-translate-y-8 z-20">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full tracking-widest uppercase shadow-lg shadow-primary/30">Kurumsal</div>
              <h3 className="text-sm font-bold tracking-widest uppercase text-primary mb-4 mt-4">Tam Erişim</h3>
              <div className="text-4xl font-bold mb-8 italic bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary drop-shadow-sm">Özel Teklif</div>
              <div className="space-y-5 mb-10 flex-1">
                {["Sınırsız kullanıcı", "Öncelikli AI işlemci", "Özel üniversite domaini", "7/24 Teknik destek"].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-primary" /> {item}
                  </div>
                ))}
              </div>
              <button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold uppercase tracking-widest text-[11px] px-5 py-4 rounded-xl shadow-md shadow-primary/30 transition-all hover:-translate-y-1">Bize Ulaşın</button>
            </div>

            {/* Basic */}
            <div className="p-10 rounded-[32px] bg-card/40 backdrop-blur-xl border border-border/40 shadow-xl shadow-black/20 flex flex-col hover:border-primary/50 transition-all">
              <h3 className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-4">Standart</h3>
              <div className="text-4xl font-bold mb-8 text-foreground">₺9.999 <span className="text-sm font-medium text-muted-foreground">/ay</span></div>
              <div className="space-y-5 mb-10 flex-1">
                {["500 Öğrenciye kadar", "25 Eğitmen hesabı", "Gelişmiş raporlama"].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
                    <CheckCircle2 className="w-5 h-5 text-blue-500" /> {item}
                  </div>
                ))}
              </div>
              <button className="w-full bg-secondary/30 hover:bg-secondary/50 text-foreground font-bold uppercase tracking-widest text-[11px] px-5 py-4 rounded-xl border border-secondary/50 shadow-sm transition-all">Satın Al</button>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/10 ring-1 ring-primary/20 flex items-center justify-center font-bold text-primary">C</div>
              <span className="text-xl font-bold tracking-tight text-foreground drop-shadow-sm">CampusFlow</span>
            </div>
            <p className="text-muted-foreground text-sm max-w-xs leading-relaxed font-medium">Yeni nesil akademik yönetim sistemi. Geleceği birlikte inşa edelim.</p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Platform</span>
              <Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Özellikler</Link>
              <Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Güvenlik</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">İletişim</span>
              <Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">Twitter</Link>
              <Link href="#" className="text-sm text-foreground/70 hover:text-primary transition-colors font-medium">E-posta</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-border/40 text-center md:text-left">
          <p className="text-muted-foreground text-[10px] tracking-widest uppercase font-bold">© 2026 CampusFlow Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
