-- 0051_meetings_ai_extension.sql
-- Toplantılar tablosuna AI Sprint Analizi için sprint bağlamı ve notları ekleme
-- Ayrıca öğrencilerin (takım üyelerinin) kendi takımlarına toplantı ekleyebilmesi için RLS

-- 1. Yeni kolonların eklenmesi
ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS meeting_notes TEXT;

-- 2. Öğrenciler (Team Members) için RLS: Insert
-- Öğrenci, sadece üyesi olduğu takımın `team_id`siyle eşleşen bir toplantı oluşturabilir.
CREATE POLICY "Team members can create team meetings"
    ON public.meetings
    FOR INSERT
    WITH CHECK (
        team_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = meetings.team_id
            AND team_members.student_id = auth.uid()
        )
    );

-- 3. Öğrenciler (Team Members) için RLS: Update
-- Öğrenci, üyesi olduğu takımın toplantılarında (notlar vb.) güncelleme yapabilir.
CREATE POLICY "Team members can update team meetings"
    ON public.meetings
    FOR UPDATE
    USING (
        team_id IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.team_id = meetings.team_id
            AND team_members.student_id = auth.uid()
        )
    );
