-- 0021_fix_teams_created_by.sql
-- teams tablosuna created_by kolonu ekle ve INSERT policy'yi düzelt

-- 1. created_by kolonu ekle (nullable, eski kayıtlar için)
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Varsa eski hatalı policy'leri kaldır
DROP POLICY IF EXISTS "teams_insert_auth" ON teams;
DROP POLICY IF EXISTS "teams_update_auth" ON teams;
DROP POLICY IF EXISTS "teams_delete_auth" ON teams;
DROP POLICY IF EXISTS "teams_insert_instructor" ON teams;
DROP POLICY IF EXISTS "teams_update_instructor" ON teams;
DROP POLICY IF EXISTS "teams_delete_instructor" ON teams;

-- 3. Yeni INSERT policy: Dersin hocası takım oluşturabilir
-- get_my_role() yerine direkt instructor_id kontrolü daha güvenilir
CREATE POLICY "teams_insert_instructor" ON teams FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = teams.course_id
    AND (
      c.instructor_id = auth.uid()
      OR p.role IN ('admin', 'super_admin')
    )
  )
);

-- 4. UPDATE policy
CREATE POLICY "teams_update_instructor" ON teams FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = teams.course_id
    AND (
      c.instructor_id = auth.uid()
      OR p.role IN ('admin', 'super_admin')
    )
  )
);

-- 5. DELETE policy
CREATE POLICY "teams_delete_instructor" ON teams FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM courses c
    JOIN profiles p ON p.id = auth.uid()
    WHERE c.id = teams.course_id
    AND (
      c.instructor_id = auth.uid()
      OR p.role IN ('admin', 'super_admin')
    )
  )
);

-- 6. team_members INSERT policy (takıma üye ekleme)
DROP POLICY IF EXISTS "team_members_insert_auth" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_instructor" ON team_members;
CREATE POLICY "team_members_insert_instructor" ON team_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    JOIN profiles p ON p.id = auth.uid()
    WHERE t.id = team_members.team_id
    AND (
      -- Hoca veya admin her zaman ekleyebilir
      c.instructor_id = auth.uid()
      OR p.role IN ('admin', 'super_admin')
      -- Sprint modu 'team' ise ve kullanıcı zaten takımda (öğrenci kendi takımına üye ekleyebilir)
      OR (c.sprint_mode = 'team' AND EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = team_members.team_id
        AND tm.student_id = auth.uid()
        AND tm.left_at IS NULL
      ))
    )
  )
);
