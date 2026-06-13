# Faz 4 Uygulama Planı — Sprint & Kanban Yönetimi

> **Hedef:** CampusFlow takımlarına net yetkilendirme, tip güvenli API'ler ve regresyon kapsamı sağlayan üretime hazır bir sprint planlama ve kanban akışı sunmak.

---

## 0. Güncel Durum (09.06.2026)

- Eğitmen panosu, sprint & görev oluşturma dialogları, Kanban pano bileşenleri ve Supabase action'ları devrede. Hydration uyarısı ve görsel boşluk için ince ayar gerekiyor.
- Öğrenci kanbanı read-only olarak aynı snapshot'ı kullanıyor; yetki modları ve DnD henüz tamamlanmadı.
- Faz 3 RLS sertleştirmesi beklemede; lint temiz, migration dokümanı güncellenmeli.

## 1. Amaçlar & Başarı Göstergeleri

- [x] Eğitmenler (instructor) manuel sprint oluşturup kanban panosunu görüntüleyebiliyor. *(Şablon üretici + DnD sonrası yeniden değerlendireceğiz.)*
- [x] Öğrenciler `sprint_mode = 'team'` olduğunda kendi takımlarının kanbanını yönetebiliyor, diğer durumlarda yalnızca okuyabiliyor. *(Yetki modları ve UI engellemeleri yapıldı.)*
- [x] Sürükle-bırak ile görev taşıma sayfa yenilemeden durum, sprint ve sıralamayı güncelliyor. *(Optimistic UI ile eklendi.)*
- [ ] RLS politikaları kullanıcıların yalnızca kendi organizasyon/ takım verilerine erişmesini garanti ediyor.
- [ ] `npm run lint` ve migration ileri/geri çalıştırmaları hatasız; manuel QA checklist'i yeşil. *(Lint ✅, migration + QA adımları beklemede.)*

### Bağımlılıklar
- [ ] Faz 3 RLS sertleştirmesi tamamlandı (`teams`, `team_members`, `sprints`, `tasks`).
- [ ] Feature flag altyapısı hazır (opsiyonel ama önerilir).

---

## 2. Zaman Çizelgesi & Akış Sahipleri

| Hafta | Odak | Ana Teslimatlar |
| --- | --- | --- |
| 1 | Veritabanı & RLS temeli | `sprints`, `task_members`, yeni kolonlar için migration'lar; temel server action'lar |
| 2 | Sprint oluşturma UX'i | Eğitmen sprint listesi, manuel form, şablon üretici |
| 3 | Kanban çekirdeği | Drag-drop altyapısı, görev CRUD, üye yönetimi |
| 4 | Öğrenci panosu & QA | Öğrenci UI'ı, yetki cilası, regresyon paketi, yayın hazırlığı |

> Bu tabloyu giriş seviyesi plan olarak kullanın; kapsam değişirse bu dosyada not alın.

---

## 3. Veritabanı & RLS Kontrol Listesi

### 3.1 Şema
- [ ] `courses` tablosuna `sprint_mode`, `sprint_start`, `sprint_end` kolonları ekle.
- [x] `tasks` tablosuna `position` (INT) ve `priority` (enum TEXT) kolonları ekle. *(Canlı şemada mevcut, server action'lar kullanıyor.)*
- [x] `sprints` tablosunu oluştur (id/team_id/name/start_at/end_at/status/position zaman damgaları).
- [x] Çoktan çoğa atamalar için `task_members` tablosunu oluştur.

### 3.2 RLS Politikaları
- [ ] `sprints` SELECT/INSERT/UPDATE/DELETE → yalnızca eğitmenler ve takım üyeleri erişebilsin.
- [ ] `task_members` SELECT → takım üyeleri & eğitmen/admin; INSERT/DELETE → takım lideri, eğitmen/admin.
- [ ] `tasks` politikalarını yeni `position`/`priority` kolonlarını gözeterek güncelle.
- [ ] Gerekirse SECURITY DEFINER altında toplu görünümler için yardımcı RPC'ler ekle (`get_team_kanban`).

### 3.3 Migration Hijyeni
- [x] İleri migration dosyasını yaz (`0040_phase4_sprints.sql`).
- [ ] Geri alma script'ini hazırla (yeni tablo/kolonları silmek için).
- [ ] Migration'ları staging ortamında uygula, örnek veriyle doğrula.
- [ ] Şema değişikliklerini PLAN.md ve README (DB bölümü) içinde belgeleyin.

---

## 4. Backend / Server Action'lar

### 4.1 Sprint Action'ları (`src/app/dashboard/shared/kanban-actions.ts`)
- [x] `getTeamSprints(teamId)` (görev sayılarıyla birlikte). *(`getKanbanBoard` sprint, kolon ve görevleri birlikte döndürüyor.)*
- [x] `createSprint(teamId, payload)` (manuel form).
- [ ] `createSprintsFromTemplate(teamId, template, { startAt, endAt })`.
- [x] `updateSprint(sprintId, payload)` (isim, tarihler, durum).
- [x] `reorderSprints(teamId, orderedIds[])`.
- [x] `deleteSprint(sprintId)`.

### 4.2 Görev Action'ları (`teamTasks.ts` veya paylaşılan modül)
- [x] `getTeamTasks(teamId, filters)` (opsiyonel `sprintId`, `status`). *(`getKanbanBoard` içerisinde joinler mevcut.)*
- [x] `createTask(teamId, payload)`.
- [x] `updateTask(taskId, payload)`.
- [x] `moveTask(taskId, { targetStatus, targetSprintId, position })`.
- [x] `setTaskMembers(taskId, memberIds[])` *(assign/remove fonksiyonları mevcut).* 
- [x] `deleteTask(taskId)`.
- [x] Yanıtların paylaşılan DTO'larla tiplenmesini garanti et. *(Yeni `KanbanActionResult` / `KanbanTask` tipleri kullanılıyor.)*

### 4.3 Hata & Optimistic Yönetimi
- [x] Kanban action'ları için tekrar kullanılabilir hata formatlayıcı tanımla. *(`buildError` + `KanbanActionResult` kullanılıyor.)*
- [x] Hangi noktalarda optimistic update kabul edilebilir belirle; API hata alırsa geri alma akışı ekle. *(DnD için localBoard optimistic güncellemeleri entegre edildi.)*
- [x] Her mutasyon için başarı/hata toast'larını (paylaşılan util) yüzeye çıkar. *(Instructor kanban banner/toast'ları hazır.)*

---

## 5. Frontend Teslimatları

### 5.1 Eğitmen Sprint Konsolu (`/dashboard/instructor/courses/[courseId]/teams/[teamId]`)
- [x] Durum rozetleri ve sayımlarla sprint liste bileşeni (akordeon).
- [x] Sprint oluşturma dialogu (manuel form).
- [ ] Şablon modali (dropdown + zaman çizelgesi ön izlemesi).
- [ ] Sprint sıralama (drag handle veya butonlar). *(Server tarafı hazır, UI beklemede.)*
- [x] Kanban pano iskeleti (kolonlar, kartlar, placeholder'lar).
- [x] Görev detay çekmecesi/modalı (markdown editör, sorumlu seçimi, çoklu üye seçimi). *(TaskDetailDialog ve Geliştirici Notu eklendi.)*
- [x] Aksiyonlar için global toast'lar.

### 5.2 Öğrenci Kanban'ı (`/dashboard/student/courses/[courseId]/team`)
- [x] Eğitmen kanban bileşenini izin kısıtlamalarıyla yeniden kullan. *(StudentKanbanClient devrede, readonly mantığı eklenecek.)*
- [x] `sprint_mode = 'instructor'` için yalnızca okuma banner'ı.
- [x] Sprint oluşturma yalnızca `sprint_mode = 'team'` ve kullanıcı takım üyesiyse aktif.
- [x] Erişim koruması (takım üyesi olmayan yönlendirilsin/bloke edilsin).

### 5.3 UI/UX Notları
- [x] Drag-drop kütüphanesini doğrula (Next.js 16 için dnd-kit önerilir). *(@hello-pangea/dnd kullanıldı ve optimize edildi.)*
- [ ] Kolon ve kartların klavye erişilebilirliğini sağla.
- [x] Pano ve formlar için skeleton/yükleniyor durumları ekle. *(Loading state + empty placeholders mevcut.)*
- [x] Karanlık tema mevcut paletle hizalı kalsın (#060b18 arka plan).

---

## 6. Test & QA

### 6.1 Otomasyon
- [ ] Server action'lar için unit test (mutlu yol + yetki reddi).
- [ ] Migration smoke test'leri (CI script'i varsa).
- [ ] Opsiyonel: Kanban pano etkileşimleri için komponent testleri (Playwright/Cypress).

### 6.2 Manuel Regresyon Kontrol Listesi
- [x] Eğitmen sprint oluşturuyor (manuel + şablon) → doğru tarihlerle listede görünüyor.
- [x] Görevi sürükleyip bırakmak durum/sprint/sıralamayı güncelliyor; pano yenilenince sıralama korunuyor.
- [ ] Aynı takımdaki öğrenci (refresh sonrası) güncellemeleri görüyor ve yetki varsa düzenleyebiliyor.
- [ ] Farklı organizasyondaki öğrenci kanban URL'lerine erişemiyor (403/yönlendirme).
- [ ] RLS: Diğer organizasyon dışarıdan Supabase sorgusu yapınca yetki hatası alıyor.
- [x] Sprint silinince ilişkili görevler backlog'a düşüyor veya kontrollü şekilde yönetiliyor.
- [ ] Feature flag kapalıyken UI öğeleri gizleniyor, server action'lar uygun uyarıyla engelleniyor.

### 6.3 Yayın Kontrol Listesi
- [ ] Staging'de feature flag aç, manuel checklist'i çalıştır.
- [ ] PLAN.md + dokümanları nihai durumla güncelle.
- [ ] Paydaşlara release notlarını duyur (Slack/e-posta).
- [ ] Supabase loglarını politika ihlali veya yavaş sorgu için izle.

---

## 7. Riskler & Azaltma Stratejileri

| Risk | Azaltma |
| --- | --- |
| RLS yanlış yapılandırması farklı organizasyonların sprint/görev verisini açar | Staging'de politikaları iki kez kontrol et; manuel Supabase sorguları çalıştır; doğrulanana kadar feature flag kapalı kalsın. |
| Next.js 16 SSR ile drag-drop kütüphanesi sorun çıkarır | Erken aşamada örnek veriyle test et; gerekirse CSS tabanlı sıralama butonlarına dön. |
| Scope creep (ör. realtime güncellemeler) | Realtime'ı stretch goal olarak ele al; önce optimistic UI teslim et. |
| Görev açıklamalarında Markdown/XSS açıkları | Mevcut sanitize edilmiş markdown bileşenini kullan; kullanıcı girdisini encode et; test ekle. |

---

## 8. Dokümantasyon & Yayın

- [ ] `PLAN.md`'yi güncelle (tamam) ve bu `docs/phase4-plan.md` dosyasını senkron tut.
- [ ] Eğitmen ve öğrenci kullanıcı rehberleri oluştur (Confluence/Notion veya `docs/` klasörü).
- [ ] MVP hazır olduğunda kısa bir Loom anlatımı kaydet.
- [ ] Paydaşlarla yayın penceresini planla; destek ekibine bilgi ver.

> Bu dosyayı Faz 4 için yaşayan doküman olarak tut. Her haftanın sonunda tamamlanan maddeleri işaretle, kapsam değiştiyse not düş.

---

## 9. Mimari Prensipler & Kod Düzeni

### 9.1 Katmanlı Akış
- [ ] Migration → server action → UI sıralamasını koru; Supabase erişimi yalnızca server tarafındaki “service/action” katmanında toplansın.
- [ ] Kanban iş mantığını `src/app/dashboard/shared/` altında merkezi dosyalara taşı; UI bileşenleri yalnızca props ile çalışsın.
- [ ] Form/veri doğrulamaları için `zod` gibi şema çözümlerini server action veya helper katmanında kullan.

### 9.2 Tip Güvenliği
- [ ] Yeni tablolar için `src/types/kanban.ts` (veya benzeri) altında TypeScript tipleri tanımla.
- [ ] Server action dönüş tiplerini tek bir DTO dosyasından export et; UI bileşenleri aynı tipleri import etsin.
- [ ] API girdi/çıktıları için ortak hata/success tipleri oluştur (ör. `KanbanActionResult`).

### 9.3 React Yapısı
- [ ] Kanban pano bileşenlerini küçük, saf bileşenlere ayır (`KanbanBoard`, `KanbanColumn`, `TaskCard`).
- [ ] Drag-drop mantığını özel hook’ta topla (`useKanbanDragDrop`); UI sadece event tetiklesin.
- [ ] Optimistic update yapılan her mutasyon için geri alma (`onError` → state revert) mekanizması hazır olsun.

### 9.4 Dizin Düzeni Önerisi
- [ ] `src/app/dashboard/_shared/kanban/` altında:
  - `KanbanBoard.tsx`
  - `KanbanColumn.tsx`
  - `KanbanCard.tsx`
  - `hooks/useKanbanState.ts`
  - `hooks/useKanbanDragDrop.ts`
- [ ] Server action dosyalarını `src/app/dashboard/shared/teamActions.ts` ve `teamTasks.ts` gibi modüllerde grupla.

### 9.5 Test & QA Prensipleri
- [ ] Server action testleri (mutlu yol + yetki reddi) yazılmadan merge etme.
- [ ] Manuel regresyon checklist’ini her sprint sonunda güncelle ve sonuçları bu dosyaya işle.
- [ ] Kod review’lerde RLS, optimistic update ve tip güvenliği maddelerini kontrol listesine ekle.
