-- 0050_meetings.sql
-- Toplantılar ve takvim etkinlikleri için tablo ve RLS kuralları

CREATE TABLE IF NOT EXISTS public.meetings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE, -- Null ise tüm dersi kapsar
    title TEXT NOT NULL,
    description TEXT,
    meeting_link TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Aktifleştir
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- 1. Hocalar kendi derslerindeki toplantıları görebilir
CREATE POLICY "Instructors can view course meetings"
    ON public.meetings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = meetings.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- 2. Hocalar kendi derslerinde toplantı oluşturabilir
CREATE POLICY "Instructors can create course meetings"
    ON public.meetings
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = meetings.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- 3. Hocalar kendi derslerindeki toplantıları silebilir
CREATE POLICY "Instructors can delete course meetings"
    ON public.meetings
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.courses
            WHERE courses.id = meetings.course_id
            AND courses.instructor_id = auth.uid()
        )
    );

-- 4. Öğrenciler takımlarına atanan VEYA tüm derse atanan (team_id IS NULL) toplantıları görebilir
CREATE POLICY "Students can view team and course-wide meetings"
    ON public.meetings
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.student_id = auth.uid()
            AND (
                team_members.team_id = meetings.team_id
                OR
                (meetings.team_id IS NULL AND EXISTS (
                    SELECT 1 FROM public.teams
                    WHERE teams.id = team_members.team_id
                    AND teams.course_id = meetings.course_id
                ))
            )
        )
    );

-- 5. Öğrenciler kendi takımları için toplantı oluşturabilir
CREATE POLICY "Students can create meetings for their teams"
    ON public.meetings
    FOR INSERT
    WITH CHECK (
        team_id IS NOT NULL 
        AND 
        EXISTS (
            SELECT 1 FROM public.team_members
            WHERE team_members.student_id = auth.uid()
            AND team_members.team_id = meetings.team_id
        )
    );

-- 6. Herkes kendi oluşturduğu toplantıyı silebilir (Öğrenci iptali)
CREATE POLICY "Users can delete their own meetings"
    ON public.meetings
    FOR DELETE
    USING (created_by = auth.uid());
