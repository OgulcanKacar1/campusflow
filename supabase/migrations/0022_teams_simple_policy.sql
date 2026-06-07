-- 0022_teams_simple_policy.sql
-- Tüm teams policy'lerini temizleyip sadece instructor_id kontrolü yap

-- 1. Tüm mevcut policy'leri kaldır
DROP POLICY IF EXISTS "teams_insert_auth" ON teams;
DROP POLICY IF EXISTS "teams_update_auth" ON teams;
DROP POLICY IF EXISTS "teams_delete_auth" ON teams;
DROP POLICY IF EXISTS "teams_insert_instructor" ON teams;
DROP POLICY IF EXISTS "teams_update_instructor" ON teams;
DROP POLICY IF EXISTS "teams_delete_instructor" ON teams;
DROP POLICY IF EXISTS "teams_select_same_org" ON teams;
DROP POLICY IF EXISTS "teams_update_owner_or_instructor" ON teams;

-- 2. SELECT policy: Sadece org içindeki kullanıcılar görsün
-- (0019_fix_teams_rls.sql'deki gibi ama daha basit)
CREATE POLICY "teams_select" ON teams FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = teams.course_id
    AND c.organization_id = p.organization_id
  )
);

-- 3. INSERT policy: Sadece dersin hocası
CREATE POLICY "teams_insert" ON teams FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = teams.course_id
    AND c.instructor_id = auth.uid()
  )
);

-- 4. UPDATE policy: Sadece dersin hocası
CREATE POLICY "teams_update" ON teams FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = teams.course_id
    AND c.instructor_id = auth.uid()
  )
);

-- 5. DELETE policy: Sadece dersin hocası
CREATE POLICY "teams_delete" ON teams FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = teams.course_id
    AND c.instructor_id = auth.uid()
  )
);

-- 6. Admin/Super_admin için ALL policy'ler (opsiyonel ama güvenli)
-- Bu policy'ler instructor'ın üzerine eklenir, OR mantığı ile çalışır
