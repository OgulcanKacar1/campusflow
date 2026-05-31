-- 0020_teams_schema.sql
-- Phase 3: Takım yönetimi için ek şema değişiklikleri

-- 1. courses tablosuna takım ayarları
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS team_mode TEXT DEFAULT 'instructor'
    CHECK (team_mode IN ('instructor', 'random', 'student')),
  ADD COLUMN IF NOT EXISTS team_min_size INT DEFAULT 2,
  ADD COLUMN IF NOT EXISTS team_max_size INT DEFAULT 5;

-- 2. teams tablosuna davet kodu (student mod için)
ALTER TABLE teams
  ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- 3. courses tablosuna sprint oluşturma modu
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS sprint_mode TEXT DEFAULT 'instructor'
    CHECK (sprint_mode IN ('instructor', 'team'));

-- 4. task_members tablosu: birden fazla kişiye görev atama
-- Mevcut tasks.assigned_to tek kişi (birincil sorumlu) olarak kalır
-- task_members ek atamalar için kullanılır
CREATE TABLE IF NOT EXISTS task_members (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id    UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, student_id)
);

-- 5. task_members RLS ayarları
ALTER TABLE task_members ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, DELETE ON public.task_members TO authenticated;

CREATE POLICY IF NOT EXISTS "task_members_same_org" ON task_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tasks t 
    JOIN teams tm ON tm.id = t.team_id
    JOIN courses c ON c.id = tm.course_id
    WHERE t.id = task_id AND c.organization_id = get_my_org_id()
  ) OR get_my_role() = 'super_admin'
);

CREATE POLICY IF NOT EXISTS "task_members_insert_team" ON task_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t 
    JOIN team_members tm ON tm.team_id = t.team_id
    WHERE t.id = task_id AND tm.student_id = auth.uid() AND tm.left_at IS NULL
  ) OR get_my_role() IN ('instructor', 'admin', 'super_admin')
);

CREATE POLICY IF NOT EXISTS "task_members_delete_team" ON task_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tasks t 
    JOIN team_members tm ON tm.team_id = t.team_id
    WHERE t.id = task_id AND tm.student_id = auth.uid() AND tm.left_at IS NULL
  ) OR get_my_role() IN ('instructor', 'admin', 'super_admin')
);

-- 6. Takım büyüklüğü validasyon trigger'ı
-- Min/max kontrolü uygulama katmanında da yapılır, bu sadece son kontrol
CREATE OR REPLACE FUNCTION check_team_size()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
  v_min_size INT;
  v_max_size INT;
  v_current_count INT;
BEGIN
  -- Sadece INSERT ve left_at IS NULL olanlar için kontrol et
  IF NEW.left_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Takımın dersini ve limitlerini bul
  SELECT t.course_id, c.team_min_size, c.team_max_size
  INTO v_course_id, v_min_size, v_max_size
  FROM teams t
  JOIN courses c ON c.id = t.course_id
  WHERE t.id = NEW.team_id;

  -- Mevcut aktif üye sayısını hesapla (kendisi dahil)
  SELECT COUNT(*) INTO v_current_count
  FROM team_members
  WHERE team_id = NEW.team_id AND left_at IS NULL;

  -- Max kontrol (eğer max tanımlıysa)
  IF v_max_size IS NOT NULL AND v_current_count > v_max_size THEN
    RAISE EXCEPTION 'Takım maksimum üye sayısına ulaştı (%)', v_max_size;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı ekle (eğer yoksa)
DROP TRIGGER IF EXISTS trg_check_team_size ON team_members;
CREATE TRIGGER trg_check_team_size
  BEFORE INSERT OR UPDATE ON team_members
  FOR EACH ROW EXECUTE FUNCTION check_team_size();

-- 7. Davet kodu ile takım bulma RPC (öğrenci için)
CREATE OR REPLACE FUNCTION get_team_by_invite_code(p_code TEXT)
RETURNS TABLE (
  team_id    UUID,
  team_name  TEXT,
  course_id  UUID,
  course_name TEXT,
  member_count BIGINT
) AS $$
  SELECT
    t.id AS team_id,
    t.name AS team_name,
    t.course_id,
    c.name AS course_name,
    COUNT(tm.id) AS member_count
  FROM teams t
  JOIN courses c ON c.id = t.course_id
  LEFT JOIN team_members tm ON tm.team_id = t.id AND tm.left_at IS NULL
  WHERE t.invite_code = p_code
    AND c.organization_id = get_my_org_id()
  GROUP BY t.id, t.name, t.course_id, c.name;
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_team_by_invite_code(TEXT) TO authenticated;
