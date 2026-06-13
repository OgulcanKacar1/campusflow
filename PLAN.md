# CampusFlow — Geliştirme Planı

## Güncel Durum (2026-06-07)

### Tamamlananlar
- Instructor & student takım yönetimi tamamen reloadsuz hale getirildi; `TeamsPageClient`, `TeamSection` ve modal bileşenleri server-actions + `startTransition` akışıyla güncellendi.
- `add_team_member` RPC’si eski üyeleri yeniden aktive edebilecek şekilde genişletildi; duplicate hata senaryoları kapatıldı.
- Öğrenci ve eğitmen dashboard sayfalarındaki Supabase aksiyonları tip güvenli hale getirildi (`any` bağımlılıkları kaldırıldı, snapshot helper’ları eklendi).
- Süper admin dashboard’unda trend/top university verileri typed hale getirildi; login ve middleware tarafında lint uyarılarına yol açan desenler temizlendi.
- IDE’nin ürettiği kopya dosyalar temizlenip `.eslintignore` eklendi; repository tekrar stabilize edildi.

### Gündemdeki İşler
- Phase 3 güvenlik sertleştirmesi: RLS gevşetmelerini (0027–0028) kapatıp `teams/teams_members` SELECT policy’lerini org izolasyonu ile yeniden tanımlamak.
- Phase 4 (Sprint & Kanban) implementasyonu için veri modeli, UI akışı ve test planını netleştirmek.
- Instructor/student dashboard’larında kalan lint uyarılarını (özellikle `react/no-unescaped-entities`, `no-explicit-any`) kapatıp CI lint kontrolünü zorunlu hale getirmek.
- Toast/notification katmanını (özellikle takım CRUD başarı/hataları) ortak util olarak çıkarmak.

### Kısa Vadeli Öncelikler
1. **Phase 4 Kick-off:** Sprint & Kanban altyapısı için DB şeması + API taslaklarını finalize et, görev listesini oluştur (aşağıdaki detaylı plan).
2. **RLS Sertleştirme (Phase 3 Kapanışı):** `teams`, `team_members`, `sprints`, `tasks` SELECT policy’lerini org bazlı hale getir; `0027`, `0028` migration’larını revert veya yeni migration ile kapat.
3. **Lint/QA:** Instructor ve student sayfalarındaki kalan lint uyarılarını (quotes, unused vars, explicit any) temizle; manuel regresyon checklist’ini güncelle.
4. **Dokümantasyon:** Yeni takım akışları ve Phase 4 gereksinimleri için README/handbook güncellemesi hazırla.

## 1. VERİTABANI ANALİZİ (0001 → 0018)

### 1.1 Mevcut Tablolar

| Tablo | Amaç | Org İzolasyonu |
|---|---|---|
| `profiles` | Kullanıcılar | `organization_id` FK ✅ |
| `organizations` | Kiracılar | Ana tablo ✅ |
| `organization_domains` | Domain → Rol eşlemesi | `organization_id` FK ✅ |
| `courses` | Dersler | `organization_id` FK ✅ (0011) |
| `course_enrollments` | Öğrenci-Ders kaydı | Courses üzerinden ✅ |
| `teams` | Proje takımları | ❌ **GÜVENLİK AÇIĞI** |
| `team_members` | Takım üyelikleri | ❌ **GÜVENLİK AÇIĞI** |
| `sprints` | Sprint dönemleri | ❌ **GÜVENLİK AÇIĞI** |
| `tasks` | Görevler | ❌ **GÜVENLİK AÇIĞI** |
| `calendar_events` | Takvim etkinlikleri | ❌ **GÜVENLİK AÇIĞI** |
| `announcements` | Ders duyuruları | ❌ **GÜVENLİK AÇIĞI** |
| `ai_analyses` | AI analizleri | Instructor üzerinden ✅ |
| `grade_suggestions` | Not önerileri | Instructor üzerinden ✅ |
| `notifications` | Bildirimler | `user_id` ile ✅ |
| `task_integrations` | GitHub/Jira entegrasyonu | Task üzerinden ✅ |
| `integration_events` | Webhook logları | — |
| `webhook_queue` | Webhook kuyruğu | Service role only ✅ |

> **⚠️ GEÇİCİ AÇIKLAMALAR (Test Amaçlı - Geri Getirilecek!)**
> 
> Phase 3 testi için aşağıdaki migration'larla RLS gevşetildi:
> - `0027_disable_rls.sql` — `team_members`, `profiles` RLS kapalı
> - `0028_grants.sql` — `authenticated` rolüne tüm tablolarda tam yetki
> 
> **TODO (Phase 3 tamamlanmadan önce):**
> 1. `team_members`, `profiles`, `teams` için org-izole SELECT policy'leri
> 2. Sadece gerekli INSERT/UPDATE/DELETE policy'leri (instructor kontrollü)
> 3. `0027`, `0028` migration'larını REVERT et (ya da `0029` ile düzelt)

### 1.2 Mevcut RPC Fonksiyonları

| Fonksiyon | Amaç | Güvenlik |
|---|---|---|
| `get_my_role()` | Mevcut kullanıcının rolü | SECURITY DEFINER ✅ |
| `get_my_org_id()` | Mevcut kullanıcının org'u | SECURITY DEFINER ✅ |
| `get_my_enrolled_courses()` | Öğrencinin derslerini RLS bypass ile getir | SECURITY DEFINER ✅ |
| `get_course_by_join_code(p_join_code TEXT)` | Org izole edilmiş kod ile ders bul | SECURITY DEFINER ✅ |
| `get_registration_trend(days_back INT)` | Super admin grafik verisi | SECURITY DEFINER ✅ |
| `check_domain_status(p_domain TEXT)` | Kayıt öncesi domain kontrolü | SECURITY DEFINER ✅ |
| `get_course_teams(p_course_id UUID)` | Dersteki takımları üyeleriyle getir | SECURITY DEFINER ✅ |
| `create_team(p_course_id, p_name, p_repo_url)` | Takım oluştur + invite_code | SECURITY DEFINER ✅ |
| `update_team(p_team_id, p_name, p_repo_url)` | Takım bilgilerini güncelle | SECURITY DEFINER ✅ |
| `delete_team(p_team_id UUID)` | Takımı sil (CASCADE) | SECURITY DEFINER ✅ |
| `add_team_member(p_team_id, p_student_id)` | Takıma üye ekle | SECURITY DEFINER ✅ |
| `remove_team_member(p_team_id, p_student_id)` | Takımdan üye çıkar (soft delete) | SECURITY DEFINER ✅ |
| `get_available_students_for_team(p_course_id, p_exclude_team_id)` | Takımsız öğrencileri getir | SECURITY DEFINER ✅ |
| `create_random_teams(p_course_id, p_team_size)` | Rastgele takımlar oluştur | SECURITY DEFINER ✅ |

### 1.3 GÜVENLİK AÇIKLARI — KRİTİK

Aşağıdaki tablolar `0002_rls_policies.sql`'de `USING (true)` ile SELECT açılmış.
Sonraki migration'larda bu düzeltilmemiş → **farklı üniversiteden bir kullanıcı başka üniversitenin takım/sprint/görev verilerini görebilir.**

```sql
-- Şu an böyle (0002):
CREATE POLICY "teams_select_all"        ON teams        FOR SELECT USING (true);
CREATE POLICY "team_members_select_all" ON team_members FOR SELECT USING (true);
CREATE POLICY "sprints_select_all"      ON sprints      FOR SELECT USING (true);
CREATE POLICY "tasks_select_all"        ON tasks        FOR SELECT USING (true);
-- announcements ve calendar_events da aynı şekilde
CREATE POLICY "announcements_select_all" ON announcements    FOR SELECT USING (true);
CREATE POLICY "calendar_select_all"      ON calendar_events  FOR SELECT USING (true);
```

> **Çözüm:** `0019_fix_teams_rls.sql` migration'ı — Phase 3 başlamadan uygulanmalı.

### 1.4 Aktif RLS Durumu (Son Hal)

**profiles:** select(same_org), update(self/admin/super_admin), insert → trigger only  
**organizations:** super_admin(ALL), admin/user(SELECT own)  
**organization_domains:** super_admin(ALL), public(SELECT)  
**courses:** role bazlı tam izolasyon ✅ (0011 + 0015)  
**course_enrollments:** role bazlı tam izolasyon ✅ (0011 + 0018)  
**teams/team_members/sprints/tasks:** INSERT/UPDATE/DELETE güvenli, SELECT AÇIK ❌  

---

## 2. UYGULAMA KATMANI DURUMU

### 2.1 Tamamlanan Sayfalar

| Rol | Sayfa | Durum |
|---|---|---|
| super_admin | `/dashboard/super-admin` | ✅ Tam |
| admin | `/dashboard/admin` | ✅ Tam |
| admin | `/dashboard/admin/courses` | ✅ Tam |
| admin | `/dashboard/admin/users` | ✅ Tam |
| admin | `/dashboard/admin/settings` | ✅ Tam |
| instructor | `/dashboard/instructor` | ✅ Tam |
| instructor | `/dashboard/instructor/courses` | ✅ Tam |
| instructor | `/dashboard/instructor/courses/[id]/teams` | ✅ Tam (MOD A/B tamamlandı) |
| student | `/dashboard/student` | ✅ Tam |
| student | `/dashboard/student/courses` | ✅ Tam |
| student | `/dashboard/student/courses/[courseId]` | ✅ Tam |

### 2.2 Mimari Kararlar

- **Next.js 16**: `params` her zaman `Promise` — `await params` zorunlu
- **Middleware**: `src/proxy.ts`, export adı `proxy` (middleware.ts değil!)
- **RPC önceliği**: Rekursif RLS sorunlarını önlemek için `SECURITY DEFINER` RPC'ler kullanılıyor
- **Soft delete**: `courses.deleted_at` nullable, `status = 'deleted'` yerine timestamp ile
- **Join code**: `crypto.getRandomValues` ile 6 karakter uppercase
- **CSV enrollment**: Sadece yeni eklenen öğrenciler sayılıyor (upsert)
- **Org izolasyonu**: `get_my_org_id()` RPC ile — hiçbir yerde client'tan org_id alınmıyor

---

## 3. KALAN FAZLAR

---

### PHASE 3 — Takım Yönetimi

#### 3.1 DB Değişiklikleri

**`0019_fix_teams_rls.sql`** — Phase 3 başlamadan Supabase SQL Editor'da uygulanmalı.  
İçerik bu dosyanın `§4` bölümünde.

**`0020_teams_schema.sql`** — Takım modları için ek kolonlar:
```sql
-- courses tablosuna takım ayarları
ALTER TABLE courses
  ADD COLUMN team_mode TEXT DEFAULT 'instructor'
    CHECK (team_mode IN ('instructor', 'random', 'student')),
  ADD COLUMN team_min_size INT DEFAULT 2,
  ADD COLUMN team_max_size INT DEFAULT 5;

-- teams tablosuna davet kodu (student mod için)
ALTER TABLE teams
  ADD COLUMN invite_code TEXT UNIQUE;

-- team_members.role güncelle: 'member' | 'leader' değil → ileride student aralarında belirler
-- DB'de değişiklik yok, UI'da gösterimi farklı yapılabilir

-- task_members tablosu: birden fazla kişiye görev atama
CREATE TABLE task_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE(task_id, student_id)
);
ALTER TABLE task_members ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, DELETE ON public.task_members TO authenticated;
CREATE POLICY "task_members_same_org" ON task_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tasks t JOIN teams tm ON tm.id = t.team_id
    JOIN courses c ON c.id = tm.course_id
    WHERE t.id = task_id AND c.organization_id = get_my_org_id()
  ) OR get_my_role() = 'super_admin'
);
CREATE POLICY "task_members_insert_team" ON task_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t JOIN team_members tm ON tm.team_id = t.team_id
    WHERE t.id = task_id AND tm.student_id = auth.uid() AND tm.left_at IS NULL
  ) OR get_my_role() IN ('instructor', 'admin', 'super_admin')
);
CREATE POLICY "task_members_delete_team" ON task_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tasks t JOIN team_members tm ON tm.team_id = t.team_id
    WHERE t.id = task_id AND tm.student_id = auth.uid() AND tm.left_at IS NULL
  ) OR get_my_role() IN ('instructor', 'admin', 'super_admin')
);
```
> **Not:** Mevcut `tasks.assigned_to` kolonu tek kişilik "birincil sorumlu" olarak kalabilir. `task_members` ek atama içindir.

#### 3.2 Takım Modları

**MOD A — Instructor (Hoca Manuel)**
- Hoca takımı oluşturur, isim girer
- Derse kayıtlı öğrenciler arasından tek tek seçer ve ekler
- Hoca istediği zaman üye ekler/çıkarır

**MOD B — Random (Hoca Rastgele)**
- Hoca: takım sayısını veya takım büyüklüğünü girer
- "Takımları Oluştur" butonuna tıklar
- Sistem derse kayıtlı tüm öğrencileri `Math.random()` ile karıştırır, gruplara böler
- Her gruba otomatik isim verilir (Takım 1, Takım 2...)
- Hoca sonucu onaylar, isterlerse düzenleme yapabilir

**MOD C — Öğrenci (Student-Led + Davet)**
- Hoca modu aktif eder, min/max üye sınırını belirler
- Öğrenci "Takım Kur" butonuyla takım oluşturur + otomatik 6 karakterlik `invite_code` oluşur
- Takımı kuran öğrenci kodu arkadaşlarıyla paylaşır
- Diğer öğrenciler kodu girerek katılım isteği gönderir (veya direkt katılır — hoca seçer)
- Max üye dolunca takım kapanır

**Mod Geçişi:**
- Hoca modu değiştirebilir FAKAT mevcut takımlar silinmez, hoca önce onaylamalı
- Mod değişince uyarı modal'ı: "X takım mevcut, devam edersek mod değişir"

**Ortak Kurallar:**
- `check_single_team_per_course` trigger aktif → aynı öğrenci 2 takımda olamaz
- Takım büyüklüğü limiti (min/max) tüm modlarda geçerli
- Öğrenciler tüm takımları ve üyelerini görebilir
- Repo URL'i herhangi bir üye ekleyebilir (courses detail sayfasından)

#### 3.3 Instructor Sayfaları

**Sayfa:** `/dashboard/instructor/courses/[courseId]/teams`

| İşlem | Açıklama |
|---|---|
| Mod seç | `instructor / random / student` dropdown, min/max ayarla |
| Takım oluştur (A) | İsim gir, üye seç |
| Rastgele oluştur (B) | Takım büyüklüğü gir, oluştur, onayla |
| Takım listesi | Her takım: ad, üye sayısı, repo URL, davet kodu (C modunda) |
| Takım düzenle | İsim, repo URL |
| Takım sil | Takım + üyelikler silinir (CASCADE) |
| Üye ekle/çıkar | Derse kayıtlı öğrencilerden seç; çıkarma: `left_at` timestamp |

**Actions (`instructor/actions.ts`):** ✅ Tamamlandı
- `getCourseTeamSettings(courseId)` → mod + min/max
- `updateCourseTeamSettings(courseId, mode, min, max)`
- `getTeamsByCourse(courseId)` → RPC (üye listesiyle)
- `createTeam(courseId, name)` → insert + invite_code üret
- `createRandomTeams(courseId, teamSize)` → server-side random atama
- `updateTeam(teamId, data)` → isim, repo_url
- `deleteTeam(teamId)` → delete
- `addTeamMember(teamId, studentId)` → RPC (başka takım kontrolü ile)
- `removeTeamMember(teamId, studentId)` → RPC (soft delete)

**Components (mevcut):**
- `TeamsPageClient.tsx` → Instructor takım yönetimi sayfasının client kabuğu
- `TeamModeSettings.tsx` → Mod & min/max ayar kartı
- `CreateTeamButton.tsx` → Modal ile takım oluşturma
- `EditTeamModal.tsx` → Takım adı / repo düzenleme
- `DeleteTeamDialog.tsx` → Takım silme onayı
- `AddMemberModal.tsx` → Takıma üye ekleme (takımsız öğrenci listesi + arama)
- `RemoveMemberDialog.tsx` → Üye çıkarma onayı
- `RandomTeamsButton.tsx` → Rastgele takım oluşturma sihirbazı
- `TeamsList.tsx` → Takım kartları, sürükle-bırak üye taşıma taslağı

#### 3.4 Student Sayfaları

**Sayfa:** `/dashboard/student/courses/[courseId]` → Takım bölümü

| Durum | Gösterim |
|---|---|
| Takımım yok, mod=instructor | "Hoca sizi bir takıma ekleyecek" |
| Takımım yok, mod=student | "Takım kur veya davet kodu gir" input |
| Takımım var | Takım adı, repo URL, tüm üyeler (isim + email) |
| Tüm takımlar | Diğer takımları görüntüle (salt okunur) |

**Actions (`student/actions.ts`):**
- `getMyTeamInCourse(courseId)` → RPC
- `getAllTeamsInCourse(courseId)` → RPC
- `createTeam(courseId, name)` → insert (student mod açıksa)
- `joinTeamByInviteCode(inviteCode)` → invite_code'a göre takım bul + üye ekle

**Kilit Component:**
- `src/app/dashboard/student/courses/[courseId]/TeamSection.client.tsx` — Team summary, üyeler, diğer takımlar ve aksiyon kartları tek yerde toplandı.
- Instructor bileşenleriyle paylaşılan aksiyonlar `src/app/dashboard/student/actions.ts` üzerinden RPC çağrıları yapıyor.

---

### PHASE 4 — Sprint & Görev Yönetimi (Kanban)

#### 4.1 Amaç & Başarı Kriterleri
- Takım bazlı sprint planlama ve kanban yönetimini CampusFlow’a kazandırmak.
- Instructor panelinde tüm takımların sprint/görev durumunu izleyebilir hale getirmek, öğrencilere kendi kanbanını sağlayarak self-management’ı desteklemek.
- **Başarı ölçütleri:**
  - En az 1 takım için sprint şablonu → sprint oluşturma → görev atama → drag-drop ile durum değiştirme akışı QA’dan geçer.
  - Öğrenciler sprint ve görevleri yalnızca kendi takımları için görebilir/editleyebilir; RLS ihlali yok.
  - Lint/test (varsa) kırmızı olmadan deploy edilebilir.

#### 4.2 Mimari & Migration Planı
1. **Yeni Kolonlar** (`courses`, `tasks`)
   ```sql
   ALTER TABLE courses
     ADD COLUMN sprint_mode TEXT DEFAULT 'instructor'
       CHECK (sprint_mode IN ('instructor', 'team')),
     ADD COLUMN sprint_start DATE NULL,
     ADD COLUMN sprint_end DATE NULL;

   ALTER TABLE tasks
     ADD COLUMN position INTEGER DEFAULT 0,
     ADD COLUMN priority TEXT DEFAULT 'medium'
       CHECK (priority IN ('low','medium','high','critical'));
   ```
2. **Yeni Tablolar**
   - `sprints`: `id`, `team_id`, `name`, `start_at`, `end_at`, `status`, `position`.
   - `task_members`: Çoklu sorumlu ilişkisi (daha önce taslak haldeydi, Phase 4’te aktive edilecek).
3. **RLS Politikaları**
   - `sprints`: SELECT/INSERT/UPDATE/DELETE → takım üyeleri ve instructor’lar.
   - `task_members`: SELECT → takım üyeleri, instructor/admin; INSERT/DELETE → takım lideri + instructor.
4. **Migration Sırası**
   1. Schema değişiklikleri (`sprints`, `task_members`, yeni kolonlar).
   2. RLS policy scriptleri.
   3. Seed/örnek sprint verisi (staging için opsiyonel).

#### 4.3 API / Server Action Tasarımı
- **Sprints**
  - `getTeamSprints(teamId)` → sprint listesi (status + görev sayıları aggregate ile).
  - `createSprint(teamId, payload)` → manual sprint; `createSprintsFromTemplate(teamId, templateId, dateRange)` → şablon.
  - `updateSprint(sprintId, payload)` → ad, tarih, status.
  - `reorderSprints(teamId, orderedIds)` → drag-drop sıralaması.
- **Tasks**
  - `getTeamTasks(teamId, { sprintId, status })` → Kanban board feed’i.
  - `createTask(teamId, payload)` → backlog veya sprint.
  - `updateTask(taskId, payload)` → inline edit.
  - `moveTask(taskId, { targetStatus, targetSprintId, position })` → drag-drop handler.
  - `setTaskMembers(taskId, memberIds[])` → çoklu atama.
- **Utilities**
  - `getSprintTemplates()` → UI için hazır şablon listesi.
  - Ortak hata formatı ve optimistic update stratejisi (client tarafında).

#### 4.4 UI/UX Deliverables
**Instructor Paneli** — `/dashboard/instructor/courses/[courseId]/teams/[teamId]`
1. Sprint kart listesi (accordion): sprint adı, tarih aralığı, status, görev sayısı, actions.
2. “Sprint oluştur” diyaloğu
   - Manuel form (ad + tarih)
   - Şablondan oluşturma (select + date range)
3. Kanban Board (takım bazlı)
   - Sütun heading: backlog + 4 statü
   - Her kart: başlık, assignee avatar, öncelik badge, due (opsiyonel)
   - Drag-drop ile sütun/th sprint değişimi
4. Modal/Drawer: görev detayını düzenleme
   - Markdown açıklama editörü
   - Sprint seçimi (dropdown)
   - Birincil sorumlu ve ek ekip üyeleri multi select

**Student Paneli** — `/dashboard/student/courses/[courseId]/team`
1. Kendi takım sprint listesi (read/write): sprint oluşturma yalnızca `sprint_mode=team` ise aktif.
2. Kanban board (yalnızca kendi takımı)
   - Yetki kontrolü: sadece takım üyeleri edit, instructor read-only.
3. Bilgilendirme barı: `sprint_mode` override ise (örn. instructor modunda) açıklama banner’ı.

#### 4.5 Teknik Görev Dağılımı (Sprint Bazlı)
**Hafta 1**
- Migration’lar + RLS (DB)
- Server actions & types (Sprints + Tasks)
- Instructor sprint listesi UI (read-only)

**Hafta 2**
- Sprint oluşturma dialogları + şablon motoru
- Kanban board temel iskeleti (statik veri)
- Drag-drop altyapısı (dnd-kit veya sortable-data-structure)

**Hafta 3**
- Kanban board → gerçek server action entegrasyonu
- Task detay modalı + Markdown editoru
- Task member management (multi select + API)

**Hafta 4**
- Student kanban sayfası (permissions ile)
- Realtime / optimistic update iyileştirmesi (opsiyonel)
- QA & regresyon: takımlar, sprintler, görevler, RLS verification

#### 4.6 Test & QA Check List
- **Unit/E2E**: (Var olan test frameworküne göre) server action’lar için basic unit test veya integration.
- **Manual**
  - Instructor sprint oluştur → task atama → öğrenci kanban’da görünür mü?
  - Öğrenci `sprint_mode=instructor` iken sprint ekleyemiyor mu?
  - RLS: farklı organization öğrencisi sprint/görev verisini göremiyor.
  - Drag-drop sonrası position’lar doğru güncelleniyor mu (API response & DB)?
- **Tooling**
  - `npm run lint` & format → clean.
  - DB migration rollback/forward testi (staging).

#### 4.7 Yayın Stratejisi & Dokümantasyon
- Release öncesi: Sprint/Görev modülünün feature flag’i (`feature_flags.sprint_management` vb.) ile aç/kapa.
- Kullanım kılavuzu: Instructor için “Sprint & Kanban nasıl kullanılır?” wiki maddesi; öğrenci için kısa onboarding.
- Monitoring: Supabase loglarında `task_members` ve `sprints` policy ihlali var mı kontrol.

#### 4.8 Bağımlılıklar & Riskler
- Phase 3 RLS sertleştirmesi tamamlanmadan Phase 4’e geçilmemeli (policy güvenliği).
- Drag-drop kütüphanesi seçimi (dnd-kit vs react-beautiful-dnd) → performans & SSR uyumluluğu test edilmeli.
- Markdown editörü (mevcut component kullanılacak mı?) → XSS temizliği.
- Potansiyel scope creep: Kanban için realtime (Supabase Realtime) opsiyonel, MVP’de optimistic update yeterli.

---

### PHASE 5 — Not Önerileri (Grade Suggestions)

#### 5.1 Effort Score Formülü

```
Öncelik ağırlıkları: low=1 | medium=2 | high=3 | critical=4

completed_score = SUM(weight) for (tasks WHERE assigned_to=student OR student IN task_members AND status='done')
total_score     = SUM(weight) for (tasks WHERE assigned_to=student OR student IN task_members)

base_score = (completed_score / total_score) * 100   → 0-100

Sprint zamanında teslim bonusu:
  on_time_tasks = tamamlanan görevlerin sprint bitiş tarihinden önce done olma sayısı
  on_time_ratio = on_time_tasks / completed_tasks
  bonus = on_time_ratio * 10   → max +10 puan

effort_score = MIN(base_score + bonus, 100)
```

Bu metrikler `grade_suggestions.metrics` JSONB kolonuna kaydedilir:
```json
{
  "completed_tasks": 8,
  "total_tasks": 10,
  "weighted_score": 85.0,
  "on_time_ratio": 0.87,
  "sprint_breakdown": [...]
}
```

#### 5.2 Senaryolar

| Senaryo | Açıklama |
|---|---|
| Rapor iste | Hoca "Rapor Oluştur" tıklar → sprint veya dönem sonu seçer |
| AI analizi | Veriler OpenAI GPT-4o-mini'ye gönderilir, Türkçe rapor + effort_score döner |
| Birden fazla istek | Aynı takım için birden fazla rapor istenebilir (farklı sprint veya dönem) |
| Nihai not | Hoca AI'nın önerisini görür, kendi notunu girer. AI önerisi her zaman tavsiye niteliğindedir. |
| Gizlilik | Öğrenci ne puanı ne raporu göremez — `grade_select_student_or_instructor` RLS sadece hocaya açık |

> **DB Notu:** Mevcut RLS `grade_suggestions` için öğrenci `student_id = auth.uid()` ile görebiliyor.  
> Bu **değiştirilmeli**: `0021_fix_grade_rls.sql` ile öğrenci SELECT'i kapatılmalı.

**Actions:**
- `requestGradeReport(courseId, teamId, sprintId?)` → AI'ya gönder, kaydet
- `updateInstructorGrade(suggestionId, finalGrade, feedback)` → hoca notunu yazar
- `getTeamGrades(courseId, teamId)` → tüm raporlar

**Sayfa:** `/dashboard/instructor/courses/[courseId]/teams/[teamId]/grades`

---

### PHASE 6 — Takvim & Bildirimler

#### 6.1 Takvim

**Etkinlik türleri:** `exam | assignment | presentation | meeting | other`

| Kim | Ne yapabilir |
|---|---|
| Hoca | Ders etkinliği oluşturur (sınav, ödev, sunum tarihi) |
| Hoca | Takım takvimlerine etkinlik ekler (meeting linki, toplantı) |
| Öğrenci | Kendi takımı için etkinlik oluşturur (meeting, stand-up) |
| Öğrenci | Tüm ders ve takım etkinliklerini görür |

`meeting_url` field'ı zaten tabloda mevcut.

**Sayfa:** `/dashboard/instructor/courses/[courseId]/calendar`  
**Sayfa:** `/dashboard/student/courses/[courseId]` → Takvim bölümü

#### 6.2 Bildirimler

**Real-time:** Supabase Realtime ile `notifications` tablosuna subscribe — sayfa açıkken anlık gelir.

**Email gönderilecek durumlar (önemli):**
- Hoca meeting linki + toplantı bildirimi gönderdiğinde
- Sprint bitiş tarihi 24 saat kalmış
- Takıma üye eklendiğinde

**Sadece in-app (önemsiz):**
- Görev atanması
- Görev durum değişikliği
- Yeni duyuru

**DB Notu:** `notifications.type` değerleri:  
`team_added | task_assigned | sprint_reminder | meeting | announcement`

**Actions:**
- `sendMeetingNotification(teamId, link, message)` → tüm üyelere notification + email
- `notifyTaskAssignment(taskId, studentId)` → in-app
- `checkUpcomingSprints()` → cron-like, sayfa yüklenirken kontrol

---

### PHASE 7 — GitHub Entegrasyonu

#### 7.1 OAuth Flow

1. Hoca/öğrenci "GitHub Bağla" tıklar → `/api/github/auth` → GitHub OAuth URL
2. GitHub callback → `/api/github/callback` → authorization code → access token
3. Token şifreli (`ENCRYPTION_KEY` env var ile AES-256) `task_integrations` veya yeni `github_connections` tablosuna kaydedilir
4. Bağlantı sonrası repo listesi çekilir, takıma repo seçilir
5. Webhook kurulur: repo'ya `push`, `pull_request`, `issues` event'leri için

#### 7.2 Senkronizasyon Senaryoları

| Event | Aksiyon |
|---|---|
| PR açıldı | İlgili task bulunur (PR title'da `#taskId` aranır), durum `review`'a çekilir |
| PR merge | Task otomatik `done` yapılır |
| Commit push | `integration_events`'e log yazılır |
| Issue kapandı | Eşleşen task `done` yapılır |

**DB Not:** Yeni `github_connections` tablosu gerekebilir:
```sql
CREATE TABLE github_connections (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id      UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  repo_full_name TEXT NOT NULL,  -- "ogulcan/campusflow"
  access_token TEXT NOT NULL,    -- encrypted
  webhook_id   TEXT,             -- GitHub webhook ID
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**API Routes:**
- `GET /api/github/auth` → OAuth başlat
- `GET /api/github/callback` → token al, kaydet
- `POST /api/github/webhook` → event işle, queue'ya yaz

---

### PHASE 8 — AI Analizleri

#### 8.1 Sağlayıcı: OpenAI GPT-4o-mini

- **Maliyet:** ~$0.00015/1K input token, ~$0.0006/1K output token — dönem raporu başına ~$0.01-0.05
- **Dil:** Türkçe prompt + Türkçe çıktı
- **API Key:** `OPENAI_API_KEY` env var (server-side only, client'a asla açılmaz)

#### 8.2 Tetikleme

Hoca "Rapor Oluştur" butonuna tıklar ve seçer:
- Sprint raporu (belirli bir sprint için)
- Dönem sonu raporu (tüm sprint'ler)
- Birden fazla rapor istenebilir, tümü `ai_analyses` tablosuna kaydedilir

#### 8.3 Prompt Yapısı

```
Sen bir akademik proje değerlendirme asistanısın.
Aşağıdaki veriler, [DERS ADI] dersindeki [TAKIM ADI] takımına aittir.

Sprint: [SPRINT ADI] ([TARİH ARALIĞI])
Takım Üyeleri ve Görev İstatistikleri:
[JSON formatında: öğrenci adı, tamamlanan/toplam görev, öncelik dağılımı, on-time oranı]

Lütfen şunları yap:
1. Her öğrenci için 1-100 arası effort_score hesapla
2. Takım için genel bir performans değerlendirmesi yaz (3-4 cümle)
3. Her öğrenci için kısa bir güçlü/geliştirilmesi gereken alan yaz

Çıktıyı JSON formatında ver:
{ "team_summary": "...", "members": [{ "student_id": "...", "score": 85, "summary": "..." }] }
```

#### 8.4 Çıktı

- **Sayısal:** `effort_score` (0-100), `grade_suggestions` tablosuna yazılır
- **Metin:** Türkçe rapor, `ai_analyses.results` JSONB'ye yazılır
- **Görünürlük:** Sadece hoca — öğrenci göremez (RLS)

**Actions:**
- `requestAIReport(courseId, teamId, sprintId?, type)` → Server Action, OpenAI çağırır
- `getAIReports(teamId)` → geçmiş analizler

---

## 4. YAPILACAK SONRAKI MIGRATION

### `0019_fix_teams_rls.sql` (Phase 3 öncesi)

```sql
-- 1. Eski açık SELECT policy'leri kaldır
DROP POLICY IF EXISTS "teams_select_all"        ON teams;
DROP POLICY IF EXISTS "team_members_select_all" ON team_members;
DROP POLICY IF EXISTS "sprints_select_all"      ON sprints;
DROP POLICY IF EXISTS "tasks_select_all"        ON tasks;
DROP POLICY IF EXISTS "announcements_select_all" ON announcements;
DROP POLICY IF EXISTS "calendar_select_all"     ON calendar_events;

-- 2. Org-izole SELECT policy'leri ekle
-- teams: sadece kendi organizasyonunun derslerine ait takımlar
CREATE POLICY "teams_select_same_org" ON teams FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = teams.course_id
    AND c.organization_id = get_my_org_id()
  )
  OR get_my_role() = 'super_admin'
);

CREATE POLICY "team_members_select_same_org" ON team_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = team_members.team_id
    AND c.organization_id = get_my_org_id()
  )
  OR get_my_role() = 'super_admin'
);

CREATE POLICY "sprints_select_same_org" ON sprints FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = sprints.team_id
    AND c.organization_id = get_my_org_id()
  )
  OR get_my_role() = 'super_admin'
);

CREATE POLICY "tasks_select_same_org" ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = tasks.team_id
    AND c.organization_id = get_my_org_id()
  )
  OR get_my_role() = 'super_admin'
);

CREATE POLICY "announcements_select_same_org" ON announcements FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = announcements.course_id
    AND c.organization_id = get_my_org_id()
  )
  OR get_my_role() = 'super_admin'
);

CREATE POLICY "calendar_select_same_org" ON calendar_events FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = calendar_events.course_id
    AND c.organization_id = get_my_org_id()
  )
  OR get_my_role() = 'super_admin'
);

-- 3. Hoca için takım verisi RPC
CREATE OR REPLACE FUNCTION get_course_teams(p_course_id UUID)
RETURNS TABLE (
  team_id       UUID,
  team_name     TEXT,
  repo_url      TEXT,
  status        TEXT,
  created_at    TIMESTAMPTZ,
  member_count  BIGINT
) AS $$
  SELECT
    t.id           AS team_id,
    t.name         AS team_name,
    t.repo_url,
    t.status,
    t.created_at,
    COUNT(tm.id)   AS member_count
  FROM teams t
  LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.left_at IS NULL
  WHERE t.course_id = p_course_id
  GROUP BY t.id, t.name, t.repo_url, t.status, t.created_at
  ORDER BY t.created_at ASC;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_course_teams(UUID) TO authenticated;

-- 4. Öğrenci için kendi takımı RPC
CREATE OR REPLACE FUNCTION get_my_team_in_course(p_course_id UUID)
RETURNS TABLE (
  team_id      UUID,
  team_name    TEXT,
  repo_url     TEXT,
  member_id    UUID,
  member_name  TEXT,
  member_email TEXT,
  member_role  TEXT
) AS $$
  SELECT
    t.id           AS team_id,
    t.name         AS team_name,
    t.repo_url,
    p.id           AS member_id,
    p.full_name    AS member_name,
    p.email        AS member_email,
    tm.role        AS member_role
  FROM team_members my_tm
  JOIN teams t ON t.id = my_tm.team_id
  JOIN team_members tm ON tm.team_id = t.id AND tm.left_at IS NULL
  JOIN profiles p ON p.id = tm.student_id
  WHERE my_tm.student_id = auth.uid()
    AND t.course_id = p_course_id
    AND my_tm.left_at IS NULL;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_my_team_in_course(UUID) TO authenticated;
```

---

## 5. KURAL VE PRENSİPLER

- **Org izolasyonu asla client'tan gelmiyor**: `get_my_org_id()` RPC her zaman server-side
- **`get_my_role()` / `get_my_org_id()`** RLS içinde recursive loop'u önler — her yerde bu kullanılır
- **SECURITY DEFINER RPC**: Cross-table join gereken SELECT'ler için RLS bypass en temiz çözüm
- **Soft delete**: Silinen kayıtlar `deleted_at` veya `status='deleted'` ile işaretlenir
- **trigger `check_single_team_per_course`**: Aynı öğrenci aynı derste 2 takımda olamaz — action'larda bu hatayı yakalamak gerekir
- **Phase sırası**: 3 → 4 → 5 → 6 → 7 → 8 (her faz bir öncekine bağımlı)
