-- 0052_fix_meetings_rls.sql
-- Toplantılar tablosundaki yetki kurallarını (RLS) temizleyip baştan en güvenli formatta oluşturuyoruz.

-- 1. Eski kuralları temizle
DROP POLICY IF EXISTS "Instructors can view course meetings" ON public.meetings;
DROP POLICY IF EXISTS "Instructors can create course meetings" ON public.meetings;
DROP POLICY IF EXISTS "Instructors can delete course meetings" ON public.meetings;
DROP POLICY IF EXISTS "Students can view team and course-wide meetings" ON public.meetings;
DROP POLICY IF EXISTS "Students can create meetings for their teams" ON public.meetings;
DROP POLICY IF EXISTS "Team members can create team meetings" ON public.meetings;
DROP POLICY IF EXISTS "Team members can update team meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.meetings;

-- 2. Hocalar için SELECT, INSERT, DELETE (Tüm dersi kapsar)
CREATE POLICY "Instructors can view course meetings" ON public.meetings FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
);

CREATE POLICY "Instructors can create course meetings" ON public.meetings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
);

CREATE POLICY "Instructors can delete course meetings" ON public.meetings FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.courses WHERE id = course_id AND instructor_id = auth.uid())
);

-- 3. Öğrenciler için SELECT (Kendi takımı veya tüm sınıf)
CREATE POLICY "Students can view team and course-wide meetings" ON public.meetings FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE student_id = auth.uid()
        AND (
            team_id = meetings.team_id 
            OR 
            (meetings.team_id IS NULL AND EXISTS (
                SELECT 1 FROM public.teams WHERE teams.id = team_members.team_id AND teams.course_id = meetings.course_id
            ))
        )
    )
);

-- 4. Öğrenciler için INSERT (Sadece kendi takımlarına)
CREATE POLICY "Students can create team meetings" ON public.meetings FOR INSERT WITH CHECK (
    team_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = meetings.team_id AND student_id = auth.uid()
    )
);

-- 5. Öğrenciler için UPDATE (Sadece kendi takımlarının notlarını güncelleyebilmek için)
CREATE POLICY "Students can update team meetings" ON public.meetings FOR UPDATE USING (
    team_id IS NOT NULL AND
    EXISTS (
        SELECT 1 FROM public.team_members
        WHERE team_id = meetings.team_id AND student_id = auth.uid()
    )
);

-- 6. Herkes kendi oluşturduğu toplantıyı iptal edebilir
CREATE POLICY "Users can delete their own meetings" ON public.meetings FOR DELETE USING (
    created_by = auth.uid()
);
