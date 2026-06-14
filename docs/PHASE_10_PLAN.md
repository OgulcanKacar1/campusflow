# Faz 10: In-App Takvim ve Toplantı Yönetimi

> **Amaç:** Öğrencilerin kendi aralarında, hocanın ise tüm sınıfla veya belirli takımlarla toplantı planlayabilmesi; Sprint bitiş tarihlerinin, toplantıların ve teslim tarihlerinin aynı interaktif takvim ekranında renkli şekilde görüntülenebilmesi.

---

## 1. Veritabanı ve Şema (Database & Schema)
Toplantılar ve takvim etkinlikleri için yeni bir tablo oluşturacağız.

- [ ] `supabase/migrations/0050_meetings.sql` migration dosyasını oluştur.
- [ ] `meetings` tablosunu aşağıdaki kolonlarla tanımla:
  - `id`: UUID (Primary Key)
  - `course_id`: UUID (Zorunlu, Foreign Key -> courses)
  - `team_id`: UUID (Opsiyonel, Foreign Key -> teams. Null ise tüm dersi kapsar)
  - `title`: String
  - `description`: Text (Opsiyonel)
  - `meeting_link`: String (Opsiyonel)
  - `start_time`: Timestamp with time zone
  - `end_time`: Timestamp with time zone
  - `created_by`: UUID (Foreign Key -> profiles)
  - `created_at`: Timestamp with time zone
- [ ] RLS (Row Level Security) kurallarını ekle:
  - Hocalar: Kendi dersindeki (`course_id`) tüm toplantıları görebilir, silebilir ve oluşturabilir.
  - Öğrenciler: Kendi takımlarına atanan (`team_id`) VEYA tüm derse atanan (`team_id IS NULL AND course_id = student_course`) toplantıları görebilir. Kendi takımları için toplantı oluşturabilir.
- [ ] TypeScript tiplerini (`src/types/kanban.ts` veya yeni bir dosyada) güncelle.

## 2. Sunucu İşlemleri (Backend / Server Actions)
Kullanıcıların toplantı oluşturup silebilmesi için Supabase action'larını yazacağız.

- [ ] `src/app/dashboard/shared/calendar-actions.ts` dosyasını oluştur.
- [ ] `createMeeting(data)` fonksiyonunu yaz. (Hoca ise `teamId`'yi null geçebilme yetkisi ver).
- [ ] `deleteMeeting(meetingId)` fonksiyonunu yaz. (Yetki kontrolü ile sadece oluşturan veya hoca silebilsin).
- [ ] `getCalendarEvents(teamId, courseId)` fonksiyonunu yaz:
  - Bu fonksiyon `meetings` tablosundaki verileri çekecek.
  - Aynı zamanda `sprints` tablosundaki sprintleri de çekip (startAt, endAt), hepsini tek bir takvim Event dizisinde (`CalendarEvent[]`) birleştirip döndürecek.

## 3. Arayüz ve Görselleştirme (Frontend UI)
CampusFlow'un Dark ve Glassmorphism temasına uygun tamamen custom bir takvim bileşeni çizeceğiz.

- [ ] `src/app/dashboard/_shared/calendar/CalendarView.tsx` dosyasını oluştur.
  - CSS Grid ve `date-fns` kullanarak özel bir aylık/haftalık görünüm oluştur.
  - Sprintler (Turuncu/Kırmızı arka planlı geniş barlar).
  - Toplantılar (Mavi/Mor noktalı etkinlikler) şeklinde ayrıştır.
- [ ] `src/app/dashboard/_shared/calendar/CreateMeetingDialog.tsx` dosyasını oluştur.
  - Tarih, Saat, Başlık ve Link form alanları.
  - Hoca için "Tüm Sınıfa Ata" switch butonu.
- [ ] Takım panosuna (InstructorKanbanClient ve TeamKanbanClient) sekme (Tab) yapısını ekle:
  - "Kanban Panosu" | "🗓️ Takvim & Toplantılar"
- [ ] Takvim üzerindeki etkinliklere tıklandığında detayları (Toplantı linki, açıklaması, silme butonu) gösteren ufak bir Popover/Dialog ekle.

## 4. Test ve Doğrulama (QA)
- [ ] Migration çalıştırılıp tabloların geldiği kontrol edilecek.
- [ ] Hoca hesabı ile tüm sınıfa (Genel) toplantı atılıp, farklı takımlardaki öğrencilerin takviminde görünüp görünmediği test edilecek.
- [ ] Öğrenci hesabı ile sadece kendi takımına toplantı atılıp, diğer takımlardan izole olduğu doğrulanacak.
- [ ] Takvimin ay geçişlerinde çökmeyip doğru günleri (Grid) gösterdiği teyit edilecek.
