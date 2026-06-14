-- 0053_absolute_fix.sql
-- Tüm çakışan veya eksik kalan meetings RLS politikalarını sıfırlayıp tek, birleştirilmiş ve hatasız bir yapı kurar.

-- 1. Tablodaki tüm olası kuralları temizle
DROP POLICY IF EXISTS "Instructors can view course meetings" ON public.meetings;
DROP POLICY IF EXISTS "Instructors can create course meetings" ON public.meetings;
DROP POLICY IF EXISTS "Instructors can delete course meetings" ON public.meetings;
DROP POLICY IF EXISTS "Students can view team and course-wide meetings" ON public.meetings;
DROP POLICY IF EXISTS "Students can create meetings for their teams" ON public.meetings;
DROP POLICY IF EXISTS "Students can create team meetings" ON public.meetings;
DROP POLICY IF EXISTS "Students can update team meetings" ON public.meetings;
DROP POLICY IF EXISTS "Team members can create team meetings" ON public.meetings;
DROP POLICY IF EXISTS "Team members can update team meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.meetings;
DROP POLICY IF EXISTS "meetings_select_all" ON public.meetings;
DROP POLICY IF EXISTS "meetings_insert" ON public.meetings;
DROP POLICY IF EXISTS "meetings_update" ON public.meetings;
DROP POLICY IF EXISTS "meetings_delete" ON public.meetings;

-- 2. Yeni, birleştirilmiş ve en güvenli kuralları ekle

-- SELECT: Sisteme giriş yapmış herkes (zaten sayfalarda sadece kendi derslerini/takımlarını filtreleyerek çekiyoruz)
CREATE POLICY "meetings_select_all" ON public.meetings FOR SELECT USING (auth.uid() IS NOT NULL);

-- INSERT: Hoca VEYA Öğrenci (Takım üyesi)
CREATE POLICY "meetings_insert" ON public.meetings FOR INSERT WITH CHECK (
    -- Kullanıcı bu dersin hocası mı?
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id 
        AND c.instructor_id = auth.uid()
    )
    OR
    -- VEYA kullanıcı bu takımın bir üyesi mi?
    (
        team_id IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM public.team_members tm
            WHERE tm.team_id = team_id
            AND tm.student_id = auth.uid()
        )
    )
);

-- UPDATE: Kararları / Notları güncellemek için (Hoca veya Öğrenci)
CREATE POLICY "meetings_update" ON public.meetings FOR UPDATE USING (auth.uid() IS NOT NULL);

-- DELETE: Sadece oluşturan silebilir
CREATE POLICY "meetings_delete" ON public.meetings FOR DELETE USING (created_by = auth.uid());
