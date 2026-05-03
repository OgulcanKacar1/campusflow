'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Bot, Shield, BarChart3, Users, Zap, CheckCircle2 } from 'lucide-react';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.2 }
  }
};

export default function Home() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-purple-500/30 font-sans overflow-x-hidden">
      {/* Arkaplan Efektleri */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-900/20 blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold">
              C
            </div>
            <span className="text-xl font-bold tracking-tight">CampusFlow</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#features" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block">Özellikler</Link>
            <Link href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors hidden md:block mr-4">Fiyatlandırma</Link>
            <Link 
              href="/login" 
              className="px-5 py-2.5 text-sm font-medium rounded-full bg-white text-black hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
              Giriş Yap <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-purple-300 mb-8"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
            </span>
            CampusFlow v2.0 Yayında!
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight"
          >
            Üniversite Süreçlerini <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-500">
              Yapay Zeka
            </span> ile Otomatize Edin
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Akademik proje yönetimi, akıllı notlandırma ve izole kurum altyapısıyla
            öğrenci ve hocalar arasındaki duvarları yıkın.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              href="/login" 
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              Platforma Git
            </Link>
            <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-white font-medium hover:bg-white/10 transition-colors border border-white/10">
              Demo İste
            </button>
          </motion.div>
        </div>

        {/* Dashboard Mockup Placeholder */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5, type: 'spring' }}
          className="max-w-6xl mx-auto mt-20 relative"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl blur opacity-30 animate-pulse" />
          <div className="relative aspect-[16/9] rounded-2xl bg-[#0a0a0a] border border-white/10 overflow-hidden flex flex-col items-center justify-center">
            {/* 
              BURAYA EKRAN GÖRÜNTÜSÜ GELECEK
              İleride buraya <img src="/dashboard-screenshot.png" className="w-full h-full object-cover" /> koyabilirsin.
            */}
            <div className="text-center p-8">
              <div className="w-20 h-20 bg-white/5 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-white/10">
                <BarChart3 className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-xl font-medium text-gray-300">Dashboard Görseli (Placeholder)</h3>
              <p className="text-gray-500 mt-2">Daha sonra buraya uygulamanın ekran görüntüsünü ekleyebilirsin.</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-32 px-6 bg-black/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Neden CampusFlow?</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">Modern akademik dünyanın ihtiyaç duyduğu tüm araçlar tek bir platformda toplandı.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { icon: Bot, title: "AI Destekli Asistan", desc: "Hocalar için otomatik notlandırma önerileri ve projeler için yapay zeka analizleri.", color: "text-purple-400", bg: "bg-purple-400/10" },
              { icon: Shield, title: "İzole Organizasyonlar", desc: "Her üniversite kendi güvenli ve izole veritabanı alanında (tenant) çalışır.", color: "text-blue-400", bg: "bg-blue-400/10" },
              { icon: Users, title: "Gelişmiş Takım Sistemi", desc: "Rastgele, manuel veya yetenek bazlı gelişmiş takım oluşturma algoritmaları.", color: "text-emerald-400", bg: "bg-emerald-400/10" },
            ].map((feature, i) => (
              <motion.div 
                key={i}
                variants={fadeIn}
                className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
              >
                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-7 h-7 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Üniversiteniz İçin En Uygun Plan</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">İhtiyacınıza göre ölçeklenebilen, şeffaf fiyatlandırma seçenekleri.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {/* Trial */}
            <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col">
              <h3 className="text-xl font-bold mb-2">Deneme (Trial)</h3>
              <p className="text-gray-400 mb-6">Sistemi test etmek isteyen okullar için.</p>
              <div className="text-4xl font-bold mb-8">Ücretsiz</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400" /> Max 50 Öğrenci</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400" /> 3 Eğitmen (Instructor)</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400" /> Temel AI Özellikleri</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">Hemen Başla</button>
            </motion.div>

            {/* Premium */}
            <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-gradient-to-b from-purple-600/20 to-blue-600/10 border border-purple-500/30 flex flex-col relative transform md:-translate-y-4">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full text-xs font-bold tracking-wide">EN ÇOK TERCİH EDİLEN</div>
              <h3 className="text-xl font-bold mb-2">Kurumsal</h3>
              <p className="text-gray-400 mb-6">Tüm okulu dijitalleştirmek isteyenler için.</p>
              <div className="text-4xl font-bold mb-8">Özel Fiyat</div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400" /> Sınırsız Öğrenci</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400" /> Sınırsız Eğitmen</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400" /> Tam Kapsamlı AI Asistanı</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400" /> 7/24 Öncelikli Destek</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 transition-opacity font-medium">İletişime Geçin</button>
            </motion.div>

            {/* Basic */}
            <motion.div variants={fadeIn} className="p-8 rounded-3xl bg-white/5 border border-white/5 flex flex-col">
              <h3 className="text-xl font-bold mb-2">Başlangıç (Basic)</h3>
              <p className="text-gray-400 mb-6">Küçük fakülteler ve enstitüler için.</p>
              <div className="text-4xl font-bold mb-8 flex items-end gap-1">₺9.999 <span className="text-lg text-gray-500 font-normal">/ay</span></div>
              <ul className="space-y-4 mb-8 flex-1">
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400" /> Max 500 Öğrenci</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400" /> 20 Eğitmen</li>
                <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle2 className="w-5 h-5 text-purple-400" /> Standart Destek</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium">Satın Al</button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center font-bold text-xs">C</div>
            <span className="font-semibold text-gray-300">CampusFlow</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 CampusFlow Inc. Tüm hakları saklıdır.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-gray-500 hover:text-white transition-colors">Twitter</Link>
            <Link href="#" className="text-gray-500 hover:text-white transition-colors">LinkedIn</Link>
            <Link href="#" className="text-gray-500 hover:text-white transition-colors">İletişim</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
