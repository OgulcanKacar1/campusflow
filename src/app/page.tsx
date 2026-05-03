'use client';

import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Bot, Shield, BarChart3, Users, Zap, CheckCircle2, Layout, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-[#030303] text-white selection:bg-purple-500/30 font-sans overflow-x-hidden antialiased">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-purple-600/10 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_100%)]" />
      </div>

      {/* Modern Navbar */}
      <nav className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-white/[0.05] sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 p-[1px]">
              <div className="w-full h-full bg-black rounded-[11px] flex items-center justify-center font-bold text-lg">
                C
              </div>
            </div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">
              CampusFlow
            </span>
          </div>
          <div className="flex items-center gap-8">
            <div className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-sm text-white/50 hover:text-white transition-colors">Özellikler</Link>
              <Link href="#pricing" className="text-sm text-white/50 hover:text-white transition-colors">Fiyatlandırma</Link>
            </div>
            <Link 
              href="/login" 
              className="px-6 py-2 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-all active:scale-95 flex items-center gap-2"
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
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-purple-300 mb-10 shadow-[0_0_20px_rgba(168,85,247,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CampusFlow v2.0 Şimdi Üniversitelerde</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-10 leading-[1.2]"
          >
            Akademik Hayatı <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400">
              Yeniden Tanımlayın
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-base md:text-lg text-white/50 mb-14 max-w-2xl mx-auto leading-relaxed"
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
              className="w-full sm:w-auto px-10 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold hover:shadow-[0_0_30px_rgba(147,51,234,0.3)] transition-all active:scale-95 text-center"
            >
              Hemen Başla
            </Link>
            <button className="w-full sm:w-auto px-10 py-4 rounded-full bg-white/5 text-white/80 font-bold hover:bg-white/10 transition-all border border-white/10 hover:text-white">
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
          <div className="absolute -inset-[2px] bg-gradient-to-r from-purple-500/50 via-blue-500/50 to-emerald-500/50 rounded-[32px] blur-2xl opacity-20" />
          <div className="relative rounded-[30px] bg-[#0a0a0a] border border-white/10 p-2 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent pointer-events-none" />
            <div className="aspect-[16/10] w-full rounded-[22px] bg-zinc-900/50 border border-white/5 flex flex-col items-center justify-center relative overflow-hidden">
              {/* Burası senin logo/görsel alanın */}
              <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
                <Layout className="w-24 h-24 text-white/10 mb-6" />
                <p className="text-white/20 font-mono text-sm tracking-widest uppercase">Dashboard Screenshot Area</p>
              </div>
              
              {/* Cam efekti parlaması */}
              <div className="absolute top-0 left-1/4 w-1/2 h-full bg-white/[0.02] skew-x-[-25deg] transform transition-transform duration-1000 group-hover:translate-x-full" />
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Akıllı Çözümler</h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">CampusFlow, akademik verimliliği artırmak için geliştirilen son teknoloji araçlarla donatılmıştır.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { icon: Bot, title: "AI Notlandırma", desc: "Yapay zeka ile proje kriterlerini analiz edin ve objektif geri bildirimler oluşturun.", gradient: "from-purple-500/20 to-transparent" },
              { icon: Shield, title: "Güvenli Altyapı", desc: "Her üniversite için tamamen izole veritabanı ve güvenli kimlik doğrulama süreçleri.", gradient: "from-blue-500/20 to-transparent" },
              { icon: Users, title: "Takım Yönetimi", desc: "Öğrencileri ilgi alanlarına ve yeteneklerine göre en uygun takımlara yerleştirin.", gradient: "from-emerald-500/20 to-transparent" },
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeInUp}
                custom={i}
                className="group relative p-1 rounded-3xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.05] transition-all"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.gradient} opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl`} />
                <div className="relative p-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                    <f.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4 tracking-tight">{f.title}</h3>
                  <p className="text-white/40 leading-relaxed text-sm md:text-base">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section - REDESIGNED */}
      <section id="pricing" className="relative z-10 py-32 px-6 bg-[#070707]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Esnek Paketler</h2>
            <p className="text-white/40 text-lg">Organizasyonunuzun ölçeğine uygun planı seçin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Trial */}
            <div className="p-10 rounded-[32px] bg-white/[0.03] border border-white/[0.08] flex flex-col hover:border-white/20 transition-all">
              <h3 className="text-xl font-medium text-white/60 mb-2">Deneme</h3>
              <div className="text-4xl font-bold mb-8">Ücretsiz</div>
              <div className="space-y-5 mb-10 flex-1">
                {["50 Öğrenciye kadar", "3 Eğitmen hesabı", "Temel AI desteği"].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/40">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {item}
                  </div>
                ))}
              </div>
              <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all font-bold border border-white/10">Denemeye Başla</button>
            </div>

            {/* Premium - Featured */}
            <div className="relative p-12 rounded-[40px] bg-white/[0.06] border-2 border-purple-500/50 flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.15)] transform md:-translate-y-8 z-20">
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-1.5 bg-purple-500 text-[10px] font-bold rounded-full tracking-widest uppercase shadow-lg">Kurumsal</div>
              <h3 className="text-2xl font-bold text-white mb-2 mt-6">Tam Erişim</h3>
              <div className="text-4xl font-bold mb-8 italic bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">Özel Teklif</div>
              <div className="space-y-5 mb-10 flex-1">
                {["Sınırsız kullanıcı", "Öncelikli AI işlemci", "Özel üniversite domaini", "7/24 Teknik destek"].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white">
                    <CheckCircle2 className="w-4 h-4 text-purple-500" /> {item}
                  </div>
                ))}
              </div>
              <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)] transition-all font-bold">Bize Ulaşın</button>
            </div>

            {/* Basic */}
            <div className="p-10 rounded-[32px] bg-white/[0.03] border border-white/[0.08] flex flex-col hover:border-white/20 transition-all">
              <h3 className="text-xl font-medium text-white/60 mb-2">Standart</h3>
              <div className="text-4xl font-bold mb-8">₺9.999 <span className="text-sm font-normal text-white/30">/ay</span></div>
              <div className="space-y-5 mb-10 flex-1">
                {["500 Öğrenciye kadar", "25 Eğitmen hesabı", "Gelişmiş raporlama"].map(item => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/40">
                    <CheckCircle2 className="w-4 h-4 text-blue-500" /> {item}
                  </div>
                ))}
              </div>
              <button className="w-full py-4 rounded-2xl bg-white/5 hover:bg-white/10 transition-all font-bold border border-white/10 text-white/80">Satın Al</button>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Footer */}
      <footer className="relative z-10 py-20 px-6 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold">C</div>
              <span className="text-xl font-bold tracking-tight">CampusFlow</span>
            </div>
            <p className="text-white/30 text-sm max-w-xs leading-relaxed">Yeni nesil akademik yönetim sistemi. Geleceği birlikte inşa edelim.</p>
          </div>
          <div className="flex gap-12">
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-white/20 uppercase tracking-widest">Platform</span>
              <Link href="#" className="text-sm text-white/40 hover:text-white transition-colors">Özellikler</Link>
              <Link href="#" className="text-sm text-white/40 hover:text-white transition-colors">Güvenlik</Link>
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-white/20 uppercase tracking-widest">İletişim</span>
              <Link href="#" className="text-sm text-white/40 hover:text-white transition-colors">Twitter</Link>
              <Link href="#" className="text-sm text-white/40 hover:text-white transition-colors">E-posta</Link>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/[0.05] text-center md:text-left">
          <p className="text-white/20 text-[10px] tracking-widest uppercase italic">© 2026 CampusFlow Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
