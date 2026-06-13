-- 0047_ai_sprint_reports.sql
CREATE TABLE IF NOT EXISTS ai_sprint_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  sprint_id UUID NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
  report_content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sprint_id)
);

-- Enable RLS
ALTER TABLE ai_sprint_reports ENABLE ROW LEVEL SECURITY;

-- Sadece dersin eğitmenleri (instructor) kendi takımlarının AI raporlarını görebilir ve oluşturabilir
CREATE POLICY "ai_reports_instructor_manage" ON ai_sprint_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN courses c ON c.id = t.course_id
      WHERE t.id = ai_sprint_reports.team_id AND c.instructor_id = auth.uid()
    )
  );

-- Admin'lere her zaman tam yetki (Güvenlik ağı)
CREATE POLICY "ai_reports_admin_all" ON ai_sprint_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
