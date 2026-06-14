# CampusFlow - Kalan Geliştirmeler ve Yol Haritası (Roadmap)

Bu döküman, projenin mevcut (tamamlanmış) durumunu özetler ve tam sürüme (Production) geçmeden önce tamamlanması gereken kalan fazların detaylı haritasını sunar.

Kullanılacak metodoloji: Her yeni faza geçerken, o fazın detaylı teknik analizini içeren özel bir alt plan dosyası (Örn: `docs/PHASE_8_PLAN.md`) oluşturulacak ve adımlar oradan takip edilecektir.

---

## ✅ Tamamlanan Fazlar (Özet)
- [x] **Phase 1-3:** Temel altyapı, Yetkilendirme (OTP), RLS güvenlik kuralları, Multi-tenant (Çoklu okul) mimarisi.
- [x] **Phase 4:** Dinamik Takım oluşturma, Sprint planlaması ve Kanban Panosu (Görev sürükle-bırak).
- [x] **Phase 5-6:** Hoca paneli, ders açma, öğrenci kayıtları (Join Code / CSV).
- [x] **Phase 7:** GitHub Entegrasyonu V1 (Öğrenci commitleri ve PR açılışlarıyla Kanban kartlarının otomatik statü değiştirmesi).
- [x] **Phase 8:** Cloud Storage (Zero-File) Entegrasyonları (Drive/Figma linklerinin görevlere eklenebilmesi).
- [x] **Phase 9:** Yapay Zeka Performans Analizi (Sadece commit sayılarını değil, GitHub Diff/Patch okuyarak derin kod analizi yapan ve sahte commitleri yakalayan sistem).
- [x] **Phase 10:** In-App Takvim ve Toplantı Yönetimi, Takım toplantılarının/kararlarının Yapay Zeka Sprint Raporuna dahil edilmesi.

---

## 🚀 Kalan Fazlar ve Yapılacak Geliştirmeler

### 📍 Phase 11: Gerçek Zamanlı Bildirimler (Real-Time Notifications) (GÜNCEL FAZ)
Kullanıcı deneyimini "canlı" hissettirecek iletişim altyapısı.
- **Tamamlananlar:**
  - [x] Supabase Realtime (WebSockets) kullanılarak veritabanı değişikliklerinin anlık dinlenmesi altyapısı.
  - [x] Arayüze "Zil (Bildirim)" ikonu, okundu/okunmadı mantığı ve Dropdown Popover eklenmesi.
  - [x] Görev tamamlandığında, yeni görev atandığında, takvime sınıf veya takım toplantısı eklendiğinde anlık "Toast" ve zil bildirimi gönderilmesi.
  - [x] Bildirimlere bağlam (Ders Kodu, Takım Adı) eklenmesi ve Sidebar üzerindeki z-index/tasarım sorunlarının çözülmesi.
  - [x] Görev Panosu ve Takım/Proje Detayları sekmelerinin (Tabs) düzenlenmesi.
- **Tamamlanan Aksiyonlar (GitHub Webhook Entegrasyonu):**
  - [x] GitHub'dan kod (Push) geldiğinde veya PR açıldığında takım üyelerine anlık bildirim (Toast/Zil) gönderilmesi.
  - [x] İlgili Kanban görevlerinin durumlarının otomatik güncellenmesi ve bunun da bildirim sistemini tetiklemesi.

### 📍 Phase 12: Otomasyon V2 & Üniversite LMS Çıktısı (Export)
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
