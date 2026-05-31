-- 0024_team_members_select.sql
-- team_members SELECT policy (geçici olarak açık - test için)

-- Mevcut policy'leri kaldır
DROP POLICY IF EXISTS "team_members_select_all" ON team_members;
DROP POLICY IF EXISTS "team_members_select_same_org" ON team_members;

-- Açık SELECT policy (test için - sonra org-izole edilecek)
CREATE POLICY "team_members_select" ON team_members FOR SELECT USING (true);

-- INSERT policy (hocanın ekleyebilmesi için)
DROP POLICY IF EXISTS "team_members_insert_auth" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_instructor" ON team_members;

CREATE POLICY "team_members_insert" ON team_members FOR INSERT WITH CHECK (
  -- Hoca veya öğrenci kendisi
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = team_members.team_id
    AND (
      c.instructor_id = auth.uid()
      OR team_members.student_id = auth.uid()
    )
  )
);
