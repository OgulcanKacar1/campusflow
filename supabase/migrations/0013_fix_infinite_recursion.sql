-- 0013_fix_infinite_recursion.sql
-- Eski ve hatalı olan (infinite recursion'a yol açan) 0002_rls_policies kurallarını temizleme dosyası.

-- Courses tablosundaki eski kuralları sil
DROP POLICY IF EXISTS "courses_select_all" ON public.courses;
DROP POLICY IF EXISTS "courses_insert_instructor" ON public.courses;
DROP POLICY IF EXISTS "courses_update_owner" ON public.courses;
DROP POLICY IF EXISTS "courses_delete_owner" ON public.courses;

-- Course_enrollments tablosundaki eski ve hatalı kuralları sil
DROP POLICY IF EXISTS "enrollments_select_enrolled" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollment_insert_student" ON public.course_enrollments;
DROP POLICY IF EXISTS "enrollment_insert_instructor" ON public.course_enrollments;
