-- 0004_business_rules.sql
-- "Ghost Student" koruması, görevlerin tamamlanma tarihi ve yetim görevler için kolaylaştırıcı view

-- 1. "GHOST STUDENT" KORUMASI (Trigger)
-- Öğrenci dersi bıraktığında (dropped), o dersteki takım üyeliğini otomatik kapatır.
CREATE OR REPLACE FUNCTION sync_enrollment_to_team()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'dropped' THEN
    UPDATE team_members
    SET left_at = NOW()
    WHERE student_id = NEW.student_id
      AND left_at IS NULL
      AND team_id IN (
        SELECT id FROM teams WHERE course_id = NEW.course_id
      );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_enrollment
AFTER UPDATE ON course_enrollments
FOR EACH ROW EXECUTE FUNCTION sync_enrollment_to_team();

-- 2. GÖREVLER İÇİN TAMAMLANMA TARİHİ (Schema Update)
-- AI analizlerinde "zamanında bitirilmeyen görevleri" tespit etmek için gereklidir.
ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION set_task_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'done' AND OLD.status != 'done' THEN
    NEW.completed_at = NOW();
  END IF;
  IF NEW.status != 'done' AND OLD.status = 'done' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_completed_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION set_task_completed_at();

-- 3. YETİM GÖREVLER (View)
-- Atanan kişinin takımdan atılıp atılmadığını Kanban tablosunda (UI) kolayca anlamak için view.
CREATE OR REPLACE VIEW tasks_with_assignee_status AS
SELECT t.*,
  CASE 
    WHEN t.assigned_to IS NULL THEN false
    WHEN tm.left_at IS NULL THEN true 
    ELSE false 
  END AS assignee_is_active
FROM tasks t
LEFT JOIN team_members tm 
  ON tm.student_id = t.assigned_to 
  AND tm.team_id = t.team_id
  AND tm.left_at IS NULL;
