-- 0040_phase4_sprints.sql
-- Phase 4: Sprint & Kanban temel şema ve RLS güncellemeleri

-- 1. COURSES tablosuna sprint tarih aralığı kolonları ekle
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS sprint_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sprint_end TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'courses_sprint_dates_check'
  ) THEN
    ALTER TABLE courses
      ADD CONSTRAINT courses_sprint_dates_check
      CHECK (
        sprint_start IS NULL
        OR sprint_end IS NULL
        OR sprint_start <= sprint_end
      );
  END IF;
END $$;

-- 2. SPRINTS tablosunu Phase 4 şemasına uyumlu hale getir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sprints' AND column_name = 'title'
  ) THEN
    ALTER TABLE sprints RENAME COLUMN title TO name;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sprints' AND column_name = 'start_date'
  ) THEN
    ALTER TABLE sprints RENAME COLUMN start_date TO start_at;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sprints' AND column_name = 'end_date'
  ) THEN
    ALTER TABLE sprints RENAME COLUMN end_date TO end_at;
  END IF;
END $$;

ALTER TABLE sprints
  ALTER COLUMN start_at TYPE TIMESTAMPTZ USING start_at::TIMESTAMPTZ,
  ALTER COLUMN end_at TYPE TIMESTAMPTZ USING end_at::TIMESTAMPTZ,
  ALTER COLUMN status SET DEFAULT 'planning';

ALTER TABLE sprints
  ADD COLUMN IF NOT EXISTS position INT NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sprints_status_check'
  ) THEN
    ALTER TABLE sprints
      ADD CONSTRAINT sprints_status_check
      CHECK (status IN ('planning', 'active', 'completed', 'archived'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sprints_dates_check'
  ) THEN
    ALTER TABLE sprints
      ADD CONSTRAINT sprints_dates_check
      CHECK (start_at <= end_at);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sprints_team_position
  ON sprints (team_id, position ASC);

-- 3. TASKS için öncelik kontrolü (enum benzeri)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_priority_check'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_priority_check
      CHECK (priority IN ('low', 'medium', 'high', 'critical'));
  END IF;
END $$;

-- 4. RLS politika güncellemeleri
-- 4.1 SPRINTS
DROP POLICY IF EXISTS "sprints_select_same_org" ON sprints;
DROP POLICY IF EXISTS "sprints_all_auth" ON sprints;
DROP POLICY IF EXISTS "sprints_manage_scoped" ON sprints;

CREATE POLICY "sprints_select_scoped" ON sprints FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = sprints.team_id
      AND (c.organization_id = get_my_org_id() OR get_my_role() = 'super_admin')
  )
);

CREATE POLICY "sprints_manage_scoped" ON sprints FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = sprints.team_id
      AND (
        c.instructor_id = auth.uid()
        OR get_my_role() IN ('admin', 'super_admin')
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
            AND tm.student_id = auth.uid()
            AND tm.left_at IS NULL
        )
      )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = sprints.team_id
      AND (
        c.instructor_id = auth.uid()
        OR get_my_role() IN ('admin', 'super_admin')
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
            AND tm.student_id = auth.uid()
            AND tm.left_at IS NULL
        )
      )
  )
);

-- 4.2 TASKS
DROP POLICY IF EXISTS "tasks_select_same_org" ON tasks;
DROP POLICY IF EXISTS "tasks_all_auth" ON tasks;
DROP POLICY IF EXISTS "tasks_manage_scoped" ON tasks;

CREATE POLICY "tasks_select_scoped" ON tasks FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = tasks.team_id
      AND (c.organization_id = get_my_org_id() OR get_my_role() = 'super_admin')
  )
);

CREATE POLICY "tasks_manage_scoped" ON tasks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = tasks.team_id
      AND (
        c.instructor_id = auth.uid()
        OR get_my_role() IN ('admin', 'super_admin')
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
            AND tm.student_id = auth.uid()
            AND tm.left_at IS NULL
        )
      )
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM teams t
    JOIN courses c ON c.id = t.course_id
    WHERE t.id = tasks.team_id
      AND (
        c.instructor_id = auth.uid()
        OR get_my_role() IN ('admin', 'super_admin')
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = t.id
            AND tm.student_id = auth.uid()
            AND tm.left_at IS NULL
        )
      )
  )
);

-- 4.3 TASK_MEMBERS
DROP POLICY IF EXISTS "task_members_same_org" ON task_members;
DROP POLICY IF EXISTS "task_members_insert_team" ON task_members;
DROP POLICY IF EXISTS "task_members_delete_team" ON task_members;
DROP POLICY IF EXISTS "task_members_select_scoped" ON task_members;
DROP POLICY IF EXISTS "task_members_manage_scoped" ON task_members;
DROP POLICY IF EXISTS "task_members_assign_scoped" ON task_members;

CREATE POLICY "task_members_select_scoped" ON task_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN teams te ON te.id = t.team_id
    JOIN courses c ON c.id = te.course_id
    WHERE t.id = task_members.task_id
      AND (
        c.instructor_id = auth.uid()
        OR get_my_role() IN ('admin', 'super_admin')
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = te.id
            AND tm.student_id = auth.uid()
            AND tm.left_at IS NULL
        )
      )
  )
);

CREATE POLICY "task_members_assign_scoped" ON task_members FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN teams te ON te.id = t.team_id
    JOIN courses c ON c.id = te.course_id
    WHERE t.id = task_members.task_id
      AND (
        c.instructor_id = auth.uid()
        OR get_my_role() IN ('admin', 'super_admin')
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = te.id
            AND tm.student_id = auth.uid()
            AND tm.left_at IS NULL
            AND tm.role IN ('leader', 'owner')
        )
      )
  )
);

CREATE POLICY "task_members_remove_scoped" ON task_members FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM tasks t
    JOIN teams te ON te.id = t.team_id
    JOIN courses c ON c.id = te.course_id
    WHERE t.id = task_members.task_id
      AND (
        c.instructor_id = auth.uid()
        OR get_my_role() IN ('admin', 'super_admin')
        OR EXISTS (
          SELECT 1 FROM team_members tm
          WHERE tm.team_id = te.id
            AND tm.student_id = auth.uid()
            AND tm.left_at IS NULL
            AND tm.role IN ('leader', 'owner')
        )
      )
  )
);

-- 5. İlgili grant'leri koru
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sprints TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.task_members TO authenticated;
