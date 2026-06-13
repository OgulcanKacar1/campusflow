# CampusFlow - Kalan Geliştirmeler ve Yol Haritası (Roadmap)

Bu döküman, projenin mevcut (tamamlanmış) durumunu özetler ve tam sürüme (Production) geçmeden önce tamamlanması gereken kalan fazların detaylı haritasını sunar.

Kullanılacak metodoloji: Her yeni faza geçerken, o fazın detaylı teknik analizini içeren özel bir alt plan dosyası (Örn: `docs/PHASE_8_PLAN.md`) oluşturulacak ve adımlar oradan takip edilecektir.

---

## ✅ Tamamlanan Fazlar (Özet)
- **Phase 1-3:** Temel altyapı, Yetkilendirme (OTP), RLS güvenlik kuralları, Multi-tenant (Çoklu okul) mimarisi.
- **Phase 4:** Dinamik Takım oluşturma, Sprint planlaması ve Kanban Panosu (Görev sürükle-bırak).
- **Phase 5-6:** Hoca paneli, ders açma, öğrenci kayıtları (Join Code / CSV).
- **Phase 7:** GitHub Entegrasyonu V1 (Öğrenci commitleri ve PR açılışlarıyla Kanban kartlarının otomatik statü değiştirmesi).

---

## 🚀 Kalan Fazlar ve Yapılacak Geliştirmeler

### 📍 Phase 8: Cloud Storage (Zero-File) Entegrasyonları
Veritabanını devasa dosya yüklemeleriyle şişirmemek adına, doküman yönetiminin "Zero-File" (Sunucuda dosya tutmama) mimarisiyle çözülmesi.
- **Aksiyonlar:**
  - Öğrenci/Takım tarafına "Google Drive / OneDrive Bağla" seçeneği sunulması.
  - Kanban görevlerine tıklandığında, göreve doğrudan bir Drive dosyasının/klasörünün link olarak eklenebilmesi (Attachment).
  - Takım kaynakları (Resources) klasörü oluşturup, takımın ana dosyalarının tek bir Cloud klasöründe eşzamanlanması.

### 📍 Phase 9: Yapay Zeka (AI) Performans Analizi & Notlandırma (Digital Footprint)
Uygulamanın en çarpıcı (vurucu) özelliği. Sistemin GitHub verilerini yapay zeka ile analiz edip "beleşçi" öğrencileri tespit etmesi.
- **Aksiyonlar:**
  - Sadece commit mesajlarını değil, arka planda GitHub API ile **kodun içeriğini (diff - değişen satırları)** okuyan bir servis yazılması.
  - Yapay zekaya "Bu öğrenci projeye değer katan bir kod mu yazmış, yoksa boşluk/yorum satırı değiştirerek sistemi mi kandırmış?" analizinin yaptırılması.
  - Takım üyeleri arası "Katkı Haritası" (Contribution Map) grafiği çizdirilmesi.
  - Hoca için dönem sonu "AI Notlandırma Tavsiyesi" ekranı (Örn: "Tolga %80 çalıştı, Ege %20 çalıştı").

### 📍 Phase 10: Gerçek Zamanlı Bildirimler (Real-Time Notifications)
Kullanıcı deneyimini "canlı" hissettirecek iletişim altyapısı.
- **Aksiyonlar:**
  - Supabase Realtime (WebSockets) kullanılarak veritabanı değişikliklerinin anlık dinlenmesi.
  - Arayüze "Zil (Bildirim)" ikonu eklenmesi.
  - Birisi görevi tamamladığında, yeni görev atadığında veya GitHub'dan kod geldiğinde takım üyelerine anlık "Toast" (Sağ alttan çıkan uyarı) ve zil bildirimi gönderilmesi.

### 📍 Phase 11: Otomasyon V2 & Üniversite LMS Çıktısı (Export)
Sistemin kullanıcı deneyimini (UX) zirveye taşıyıp, üniversite yönetimlerine uygun hale getirilmesi.
- **Aksiyonlar:**
  - **GitHub V2:** Kullanıcıların manuel webhook adresi girmesi yerine, CampusFlow arayüzünden doğrudan repolarını listeleyip tek tıkla webhook kurdurmaları (Daha önce konuştuğumuz tam otomasyon).
  - **LMS Export:** Hocanın, AI tarafından oluşturulan not haritasını "Blackboard" veya üniversitenin kendi sistemine uygun formatta (Excel/CSV) dışa aktarabilmesi.

### 🛠️ Sürekli İyileştirmeler (Genel Refactoring & Polish)
Tüm fazlar boyunca veya en sonda yapılacak kalite artırıcı işlemler.
- UI/UX Rötuşları (Daha akıcı animasyonlar, Glassmorphism detayları).
- Loading (Yükleme) ekranlarının optimize edilmesi (Skeleton loader'lar).
- RLS (Row Level Security) kurallarının tüm endpoint'lerde son denetimi.
- Mobil uyumluluğun (Responsive) kontrol edilmesi.

---

## 🎯 Sonraki Adım Stratejisi
Yukarıdaki fazlardan hangisi seçilirse, o faz için `docs/PHASE_X_PLAN.md` isimli bir dosya oluşturulacak. O dosyada:
1. Veritabanı (Gerekiyorsa) Değişiklikleri
2. Backend (API/Actions) İhtiyaçları
3. Frontend (UI/Component) İhtiyaçları
maddeler halinde dökülecek ve geliştirme bu plana sadık kalınarak yapılacaktır.
