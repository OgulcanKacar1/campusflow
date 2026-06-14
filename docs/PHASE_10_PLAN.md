# Faz 10: In-App Takvim ve Toplantı Yönetimi & AI Entegrasyonu

> **Amaç:** Öğrencilerin kendi aralarında, hocanın ise tüm sınıfla veya belirli takımlarla toplantı planlayabilmesi; Sprint bitiş tarihlerinin, toplantıların ve teslim tarihlerinin aynı interaktif takvim ekranında renkli şekilde görüntülenebilmesi. Ek olarak takım toplantılarındaki "Toplantı Kararlarının" yapay zeka tarafından analiz edilerek Hocanın Sprint raporuna dahil edilmesi.

---

## 1. Veritabanı ve Şema (Database & Schema)
Toplantılar ve takvim etkinlikleri için yeni bir tablo oluşturacağız.

- [x] `supabase/migrations/0050_meetings.sql` migration dosyasını oluştur.
- [x] `meetings` tablosunu tanımla (course_id, team_id, title vs.).
- [x] RLS (Row Level Security) kurallarını ekle (Hocalar için).
- [x] TypeScript tiplerini (`src/types/kanban.ts`) güncelle.
- [x] **[YENİ EK]** `meetings` tablosuna `sprint_id` (UUID) ve `meeting_notes` (TEXT) kolonlarını ekleyecek migration dosyalarını (`0051`, `0052`, `0053_absolute_fix.sql`) oluştur.
- [x] **[YENİ EK]** RLS / Backend Security: Öğrencilerin (Team Members) kendi takımlarına toplantı ekleyebilmesi ve notları güncelleyebilmesi için kuralları (ve admin-bypass yetkilerini) ayarla.

## 2. Sunucu İşlemleri (Backend / Server Actions)
Kullanıcıların toplantı oluşturup silebilmesi için Supabase action'ları.

- [x] `src/app/dashboard/shared/calendar-actions.ts` oluştur ve CRUD metodlarını yaz.
- [x] `getGlobalCalendarEvents()` fonksiyonunu yaz. (Sprintleri, görevleri ve toplantıları tek bir yapıya çevir).
- [x] **[YENİ EK]** AI Entegrasyonu: `src/app/api/ai/analyze-sprint/route.ts` dosyasını, sprint altındaki toplantıları (`meetings`) da çekip prompta ekleyecek şekilde güncelle. Toplantı notu yoksa AI'ın eksiklik uyarısı vermesi sağlandı.
- [x] **[YENİ EK]** Toplantı notlarını veritabanına kaydetmek için `updateMeetingNotes(meetingId, notes)` Server Action'ını ekle.

## 3. Arayüz ve Görselleştirme (Frontend UI)
CampusFlow'un Dark ve Glassmorphism temasına uygun tamamen custom bir takvim bileşeni.

- [x] `src/app/dashboard/_shared/calendar/CalendarView.tsx` CSS Grid ile oluştur.
- [x] `CreateMeetingDialog.tsx` oluştur.
- [x] Takvimi Sidebar'a yerleştir ve sayfaları oluştur.
- [x] Detayları gösteren `EventDetailDialog.tsx` oluştur. İnline (Yerinde) silme onayını ekle.
- [x] **[YENİ EK]** `CreateMeetingDialog.tsx`: Öğrencinin kullanabilmesi için Sprint seçme (Dropdown) özelliğini entegre et. UI state hataları (Tüm Sınıf) düzeltildi.
- [x] **[YENİ EK]** `EventDetailDialog.tsx`: Eğer toplantı bir takıma aitse, detay modalına **"Toplantı Kararları"** textarea'sını ve kaydet butonunu ekle. Başlık, tarih gibi detayların da düzenlenebilmesi sağlandı.

## 4. Test ve Doğrulama (QA)
- [x] Migration çalıştırılıp tabloların geldiği kontrol edildi.
- [x] Hoca hesabı ile tüm sınıfa (Genel) toplantı atıldı, takvimde göründü.
- [x] Öğrenci (Takım Lideri) hesabıyla girip "Faz 1 Sprintine" ait bir toplantı oluşturulması test edildi.
- [x] Toplantı modalından "Toplantı Kararları" yazılıp kaydedildi (Admin bypass ile RLS problemleri çözüldü).
- [x] Hoca hesabına geçilip, o takımın ilgili Sprint panosuna gidilerek "AI Raporu" oluşturuldu. Raporda toplantı notlarındaki kararların analiz edildiği gözlemlendi.
