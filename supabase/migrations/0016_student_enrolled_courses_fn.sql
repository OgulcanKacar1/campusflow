-- 0016_student_enrolled_courses_fn.sql
-- Öğrencinin kayıtlı olduğu dersleri courses tablosundaki RLS'i
-- bypass ederek döndüren SECURITY DEFINER fonksiyon.

CREATE OR REPLACE FUNCTION public.get_my_enrolled_courses()
RETURNS TABLE (
  enrollment_id     UUID,
  enrollment_status TEXT,
  enrolled_at       TIMESTAMPTZ,  -- actually created_at in DB
  course_id         UUID,
  code              TEXT,
  name              TEXT,
  term              TEXT,
  year              INT,
  section           TEXT,
  course_status     TEXT,
  join_code         TEXT,
  instructor_id     UUID,
  instructor_name   TEXT
) AS $$
  SELECT
    ce.id                AS enrollment_id,
    ce.status            AS enrollment_status,
    ce.created_at       AS enrolled_at,
    c.id                 AS course_id,
    c.code,
    c.name,
    c.term,
    c.year,
    c.section,
    c.status             AS course_status,
    c.join_code,
    c.instructor_id,
    p.full_name          AS instructor_name
  FROM public.course_enrollments ce
  JOIN public.courses             c  ON c.id  = ce.course_id
  LEFT JOIN public.profiles       p  ON p.id  = c.instructor_id
  WHERE ce.student_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION public.get_my_enrolled_courses() TO authenticated;
