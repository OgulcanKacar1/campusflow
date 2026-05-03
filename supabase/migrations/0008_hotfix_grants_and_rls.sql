-- ============================================================
-- 0008_hotfix_grants_and_rls.sql
-- AMAÇ: Önceki migration'larda eksik kalan tablo izinlerini
-- ve bozuk RLS policy'lerini düzeltmek.
--
-- SORUNLAR:
-- 1. profiles tablosunda authenticated rolüne SELECT/UPDATE
--    yetkisi verilmemişti → "permission denied" hatası.
-- 2. profiles tablosundaki RLS policy'leri öz-referanslı
--    (recursive) bir döngüye giriyordu → profil okunamıyordu.
--
-- ÇÖZÜMLER:
-- 1. GRANT ile tablo erişim izinleri verildi.
-- 2. SECURITY DEFINER fonksiyonlar ile RLS döngüsü kırıldı.
-- 3. Tüm tablolar için eksik GRANT'lar tamamlandı.
-- ============================================================


-- 1. GRANT: Tüm tablolara authenticated rolü için erişim izni ver
-- (Migration ile oluşturulan tablolara Supabase otomatik grant vermiyor)
GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprints TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_integrations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.integration_events TO authenticated;
GRANT SELECT, INSERT ON public.webhook_queue TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calendar_events TO authenticated;
GRANT SELECT ON public.ai_analyses TO authenticated;
GRANT SELECT ON public.grade_suggestions TO authenticated;
GRANT SELECT, INSERT ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT SELECT ON public.organizations TO authenticated;

-- Sequence'lere de erişim ver (INSERT için gerekli)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;


-- 2. SECURITY DEFINER fonksiyonlar
-- profiles tablosundaki recursive RLS döngüsünü kırmak için.
-- Bu fonksiyonlar RLS'i atlayarak (SECURITY DEFINER) çalışır,
-- sadece mevcut kullanıcının kendi bilgisini okur.

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;


-- 3. Profiles tablosu RLS policy'lerini düzelt
-- Eski policy'ler profiles tablosunu kendi içinde sorguluyordu
-- (recursive), bu SECURITY DEFINER fonksiyonlarla çözüldü.

DROP POLICY IF EXISTS "profiles_select_same_org" ON profiles;

CREATE POLICY "profiles_select_same_org" ON profiles FOR SELECT USING (
  -- Kullanıcı her zaman kendi profilini okuyabilir
  id = auth.uid()
  OR
  -- super_admin tüm profilleri görebilir
  get_my_role() = 'super_admin'
  OR
  -- Aynı organizasyondaki profilleri görebilir
  organization_id = get_my_org_id()
);


-- 4. campusflow.io organizasyonunu ekle (super_admin için)
-- Super Admin'in organization_id'si bu kayda bağlanır.
INSERT INTO organizations (name, domain, status, plan)
VALUES ('CampusFlow', 'campusflow.io', 'active', 'premium')
ON CONFLICT (domain) DO NOTHING;

-- Super Admin profilini campusflow.io organizasyonuna bağla
UPDATE profiles
SET organization_id = (
  SELECT id FROM organizations WHERE domain = 'campusflow.io'
)
WHERE email = 'ogulcankacarr@gmail.com'
  AND organization_id IS NULL;
