-- 0014_fix_course_permissions.sql
-- courses ve course_enrollments tabloları için PostgreSQL yetkilerini yeniden tanımlar.
-- Eğer tablolar bir noktada silinip baştan oluşturulduysa, GRANT izinleri sıfırlanmış olabilir.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_enrollments TO authenticated;

-- Anonim erişime gerek yok ama eğer API tarafında bir noktada lazımsa:
-- GRANT SELECT ON public.courses TO anon;
