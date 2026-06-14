# Faz 11: Gerçek Zamanlı Bildirimler (Real-Time Notifications) & E-posta Entegrasyonu

> **Amaç:** Takım üyelerinin birbirleriyle olan etkileşimlerinden (yeni görev, durum değişimi, toplantı oluşturma) anında haberdar olmalarını sağlamak. Bildirimler veritabanında kalıcı olarak tutulacak ve çevrimiçi kullanıcılara WebSocket (Supabase Realtime) üzerinden anında Toast uyarısı olarak iletilecektir. Ek olarak kritik olaylar (Görev ataması ve Toplantı daveti) için e-posta entegrasyonu kurulacaktır.

---

## 1. Veritabanı ve Şema (Database & Schema)
Kalıcı bildirimleri saklamak için yeni bir tablo ve Realtime yetkilendirmesi.

- [x] `supabase/migrations/0060_notifications.sql` migration dosyasını oluştur (veya var olanı genişlet).
- [x] `notifications` tablosunu tanımla (id, user_id, title, message, type, is_read, link, created_at).
- [x] RLS (Row Level Security) kurallarını ekle (Kullanıcılar sadece kendi bildirimlerini okuyabilir/güncelleyebilir).
- [x] Supabase Dashboard veya SQL üzerinden `notifications` tablosunu Realtime yayınına (`supabase_realtime` publication) dahil et.
- [x] TypeScript tiplerini (`src/types/kanban.ts` veya `types/index.ts`) güncelle.

## 2. Altyapı ve E-posta (Email & Third-Party)
Önemli bildirimlerin kullanıcılara e-posta olarak da iletilmesi.

- [x] Projeye `resend` kütüphanesini kur (`npm install resend`).
- [x] `src/lib/mail.ts` adında merkezi bir e-posta gönderim modülü oluştur.
- [x] Çevresel değişkenlere (ENV) `RESEND_API_KEY` tanımını ekle.

## 3. Sunucu İşlemleri (Backend / Server Actions)
Kullanıcıların bildirimlerini çekmesi, okundu işaretlemesi ve tetikleyicilerin ayarlanması.

- [x] `src/app/dashboard/shared/notification-actions.ts` dosyasını oluştur. (CRUD işlemleri: okunmamışları getir, tümünü okundu işaretle, sil).
- [x] **Görev Entegrasyonu:** `kanban-actions.ts` içindeki `assignTask` fonksiyonunu, yeni atanan kişiye bildirim ve e-posta gidecek şekilde güncelle.
- [x] **Durum Entegrasyonu:** `kanban-actions.ts` içindeki `updateTaskStatus` fonksiyonunu, görev sahibine/takıma bildirim gidecek şekilde güncelle.
- [x] **Toplantı Entegrasyonu:** `calendar-actions.ts` içindeki `createMeeting` fonksiyonunu, davetli takım üyelerine bildirim ve e-posta (toplantı bilgileriyle) gidecek şekilde güncelle.
- [x] **GitHub Entegrasyonu:** `api/github/webhook/route.ts` dosyasını, yeni commit/PR geldiğinde takıma bildirim atacak şekilde güncelle.

*(Not: Bu bildirimler hocayı gereksiz yere rahatsız etmemesi için sadece ilgili "Takım Üyelerine" iletilecektir. Hoca sadece doğrudan davetli olduğu bir olayda uyarılacaktır.)*

## 4. Arayüz ve Görselleştirme (Frontend UI)
Bildirimlerin her sayfadan erişilebilir ve görünür olması.

- [x] `src/app/dashboard/_shared/notifications/NotificationBell.tsx` bileşenini oluştur (İkon, Okunmamış Rozeti ve Dropdown Popover).
- [x] `src/app/dashboard/_shared/notifications/NotificationProvider.tsx` oluştur. Bu bileşen Supabase Realtime'a WebSocket ile abone olup, yeni veri geldiğinde anlık Toast (sağ alttan/üstten) fırlatacak.
- [x] Zil ikonunu uygulamanın ana **Sidebar** (Sol menü) bileşenine entegre et, böylece her ekranda görünür olsun.

## 5. Test ve Doğrulama (QA)
- [ ] Veritabanı tablolarının ve Realtime yetkilerinin Supabase üzerinde doğrulandığı.
- [ ] Bir kullanıcıya yeni görev atandığında, diğer tarayıcı sekmesinde anlık Toast bildiriminin belirmesi.
- [ ] Zil ikonuna tıklanıp bildirimlerin okunması ve rozetteki sayının sıfırlanması.
- [ ] E-posta sisteminin, atanmış görevler ve yeni toplantılar için gelen kutusuna doğru detaylarla (Toplantı saati, linki vb.) düştüğünün kontrol edilmesi.
