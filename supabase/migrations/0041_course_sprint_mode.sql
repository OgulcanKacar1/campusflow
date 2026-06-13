-- Migration: 0041_course_sprint_mode
-- Description: Adds sprint_mode column to courses table to control agile team permissions

ALTER TABLE public.courses
ADD COLUMN sprint_mode TEXT DEFAULT 'team' NOT NULL;

ALTER TABLE public.courses
ADD CONSTRAINT courses_sprint_mode_check
CHECK (sprint_mode IN ('team', 'instructor'));

COMMENT ON COLUMN public.courses.sprint_mode IS 'Determines who can manage sprints: team (students) or instructor (teacher-only sprints).';
