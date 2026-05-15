-- 0017_student_enrollment_insert.sql
-- Öğrencilerin derse katılım kodu ile (veya doğrudan) kendilerini course_enrollments
-- tablosuna ekleyebilmeleri için gerekli INSERT yetkisi.

-- Öğrenci sadece KENDİ ID'si ile kayıt oluşturabilir.
CREATE POLICY "Students can insert their own enrollments" 
ON public.course_enrollments FOR INSERT 
WITH CHECK (
  get_my_role() = 'student' 
  AND student_id = auth.uid()
);
