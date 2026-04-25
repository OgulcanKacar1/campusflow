-- CampusFlow Initial Database Schema
-- Supabase SQL Editor için hazırlanmıştır.

-- Extensions (UUID oluşturmak için gerekli)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    avatar_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. COURSES
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    term TEXT NOT NULL CHECK (term IN ('fall', 'spring', 'summer')),
    year INT NOT NULL,
    section TEXT,
    settings JSONB DEFAULT '{}'::jsonb,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    -- Not: NULLS NOT DISTINCT PostgreSQL 15+ gerektirir. Supabase PG15+ kullandığı için sorunsuz çalışır.
    UNIQUE NULLS NOT DISTINCT (instructor_id, code, term, year, section)
);

-- 3. COURSE_ENROLLMENTS
CREATE TABLE course_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'enrolled',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, student_id)
);

-- 4. ANNOUNCEMENTS
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    link_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TEAMS
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    formation_type TEXT NOT NULL DEFAULT 'manual',
    repo_url TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. TEAM_MEMBERS
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member',
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    left_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id, student_id)
);

-- 7. SPRINTS
CREATE TABLE sprints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'planning',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (start_date <= end_date)
);

-- 8. TASKS
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL,
    -- Not: assigned_to'nun tasks.team_id'nin aktif üyesi olduğu
    -- uygulama katmanında doğrulanmalıdır.
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'todo',
    priority TEXT NOT NULL DEFAULT 'medium',
    position INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. CALENDAR_EVENTS
CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    type TEXT NOT NULL,
    meeting_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (start_time < end_time)
);

-- 10. TASK_INTEGRATIONS
CREATE TABLE task_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INTEGRATION_EVENTS
CREATE TABLE integration_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES task_integrations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. WEBHOOK_QUEUE
CREATE TABLE webhook_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform TEXT NOT NULL,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    retry_count INT NOT NULL DEFAULT 0 CHECK (retry_count >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. AI_ANALYSES
CREATE TABLE ai_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sprint_id UUID REFERENCES sprints(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    results JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_version TEXT NOT NULL,
    data_range_start TIMESTAMPTZ,
    data_range_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. GRADE_SUGGESTIONS
CREATE TABLE grade_suggestions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    effort_score FLOAT NOT NULL CHECK (effort_score >= 0 AND effort_score <= 100),
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    instructor_feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(course_id, student_id, team_id)
);

-- 15. NOTIFICATIONS
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    type TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: Updated_At değerlerini otomatik güncellemek için fonksiyon
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Tablolar için Updated_At Trigger'larını tanımlama
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_team_members_updated_at BEFORE UPDATE ON team_members FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sprints_updated_at BEFORE UPDATE ON sprints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_integrations_updated_at BEFORE UPDATE ON task_integrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_webhook_queue_updated_at BEFORE UPDATE ON webhook_queue FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_grade_suggestions_updated_at BEFORE UPDATE ON grade_suggestions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- İş Kuralları ve Doğrulamalar (Triggers)

-- 1. Bir görevin ait olduğu takım ile, bağlı olduğu sprint'in ait olduğu takım aynı olmak zorundadır.
CREATE OR REPLACE FUNCTION check_task_sprint_team()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.sprint_id IS NOT NULL THEN
    IF (SELECT team_id FROM sprints WHERE id = NEW.sprint_id) != NEW.team_id THEN
      RAISE EXCEPTION 'Sprint bu takıma ait değil';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_sprint_team
BEFORE INSERT OR UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION check_task_sprint_team();

-- 2. Derse sadece rolü 'student' olanlar kayıt olabilir.
CREATE OR REPLACE FUNCTION check_enrollment_role()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT role FROM profiles WHERE id = NEW.student_id) != 'student' THEN
    RAISE EXCEPTION 'Sadece öğrenciler derse kayıt olabilir';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enrollment_role
BEFORE INSERT OR UPDATE ON course_enrollments
FOR EACH ROW EXECUTE FUNCTION check_enrollment_role();


-- 3. Bir öğrenci aynı derste sadece bir takımda aktif olabilir.
CREATE OR REPLACE FUNCTION check_single_team_per_course()
RETURNS TRIGGER AS $$
DECLARE
  v_course_id UUID;
BEGIN
  SELECT course_id INTO v_course_id FROM teams WHERE id = NEW.team_id;

  -- Öğrenci + ders kombinasyonuna advisory lock alarak eşzamanlı INSERT'leri (race condition) blokla
  PERFORM pg_advisory_xact_lock(
    hashtext(NEW.student_id::text || v_course_id::text)
  );

  IF EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.student_id = NEW.student_id
      AND t.course_id = v_course_id
      AND tm.left_at IS NULL
      AND tm.team_id != NEW.team_id
  ) THEN
    RAISE EXCEPTION 'Öğrenci bu derste zaten başka bir takımda aktif üye';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_single_team_per_course
BEFORE INSERT OR UPDATE ON team_members
FOR EACH ROW EXECUTE FUNCTION check_single_team_per_course();


-- Performans ve Optimizasyon (Indexes)

-- Öğrencinin kendi görevlerini çekmek için
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- Sprint bazlı görev listesi
CREATE INDEX idx_tasks_sprint_id ON tasks(sprint_id);

-- Takımın aktif üyelerini hızlı çekmek için (Partial Index)
CREATE INDEX idx_team_members_active ON team_members(team_id, left_at) WHERE left_at IS NULL;

-- Bildirimleri kullanıcıya göre, okunmamışları önce çekmek için
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Webhook işleme sırası
CREATE INDEX idx_webhook_status ON webhook_queue(status, created_at);

-- Ders bazlı duyuruları hızlı çekmek için
CREATE INDEX idx_announcements_course ON announcements(course_id, created_at DESC);

-- Kanban tahtası için takım, sprint ve duruma göre hızlı filtreleme
CREATE INDEX idx_tasks_team_sprint_status ON tasks(team_id, sprint_id, status, position);

-- AI Analizi için devasa log tablosundan tarih aralığı çekmek
CREATE INDEX idx_integration_events_occurred ON integration_events(integration_id, occurred_at DESC);


-- Kolaylaştırıcı Görünümler (Views)

-- Soft delete olan dersleri filtrelemekle uğraşmamak için uygulama katmanında bu view kullanılacaktır.
CREATE OR REPLACE VIEW active_courses AS
  SELECT * FROM courses WHERE deleted_at IS NULL;

-- Takımdan ayrılmış olan (left_at) üyeleri filtrelemekle uğraşmamak için bu view kullanılacaktır.
CREATE OR REPLACE VIEW active_team_members AS
  SELECT * FROM team_members WHERE left_at IS NULL;


