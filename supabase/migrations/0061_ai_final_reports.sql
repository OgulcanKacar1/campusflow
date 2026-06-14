-- 0061_ai_final_reports.sql
CREATE TABLE IF NOT EXISTS ai_final_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  report_content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id)
);

-- Enable RLS
ALTER TABLE ai_final_reports ENABLE ROW LEVEL SECURITY;

-- Sadece dersin eğitmenleri (instructor) kendi takımlarının AI raporlarını görebilir ve yönetebilir
CREATE POLICY "ai_final_reports_instructor_manage" ON ai_final_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN courses c ON c.id = t.course_id
      WHERE t.id = ai_final_reports.team_id AND c.instructor_id = auth.uid()
    )
  );

-- Admin'lere her zaman tam yetki
CREATE POLICY "ai_final_reports_admin_all" ON ai_final_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );
