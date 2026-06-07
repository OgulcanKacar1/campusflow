-- 0030_restore_team_security.sql
-- Phase 3: Test için açılan policy/grant gevşetmelerini geri al ve org-izolasyonu yeniden kur.

-- 1. İlgili tablolar için RLS'i tekrar aktif et
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Geçici açık policy'leri temizle
DROP POLICY IF EXISTS "team_members_select_open" ON team_members;
DROP POLICY IF EXISTS "team_members_insert_open" ON team_members;
DROP POLICY IF EXISTS "profiles_select" ON profiles;

-- 3. Var olan (eski) policy'leri sıfırla
DROP POLICY IF EXISTS "teams_select_all"        ON teams;
DROP POLICY IF EXISTS "team_members_select_all" ON team_members;
DROP POLICY IF EXISTS "sprints_select_all"      ON sprints;
DROP POLICY IF EXISTS "tasks_select_all"        ON tasks;
DROP POLICY IF EXISTS "announcements_select_all" ON announcements;
DROP POLICY IF EXISTS "calendar_select_all"     ON calendar_events;
DROP POLICY IF EXISTS "profiles_select_same_org" ON profiles;

DROP POLICY IF EXISTS "teams_select_same_org"        ON teams;
DROP POLICY IF EXISTS "team_members_select_same_org" ON team_members;
DROP POLICY IF EXISTS "sprints_select_same_org"      ON sprints;
DROP POLICY IF EXISTS "tasks_select_same_org"        ON tasks;
DROP POLICY IF EXISTS "announcements_select_same_org" ON announcements;
DROP POLICY IF EXISTS "calendar_select_same_org"     ON calendar_events;

-- 4. Org-izole SELECT policy'lerini yeniden oluştur
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

CREATE POLICY "profiles_select_same_org" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR organization_id = (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- 5. Instructor & öğrenci RPC'lerini tekrar tanımla (güncel RLS ile çalışmaları için)
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
