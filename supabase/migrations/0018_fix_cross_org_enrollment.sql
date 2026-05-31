-- 0018_fix_cross_org_enrollment.sql
-- KRİTİK GÜVENLİK DÜZELTMESİ: Öğrenci sadece kendi organizasyonundaki derslere kayıt olabilmeli
-- 0017'deki eksik organization_id kontrolü ekleniyor

-- Önce hatalı policy'yi kaldır
DROP POLICY IF EXISTS "Students can insert their own enrollments" ON public.course_enrollments;

-- Doğru policy: Hem öğrenci ID'si hem de organizasyon kontrolü
CREATE POLICY "Students can insert their own enrollments" 
ON public.course_enrollments FOR INSERT 
WITH CHECK (
  get_my_role() = 'student' 
  AND student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.id = course_id
    AND c.organization_id = get_my_org_id()
    AND c.status = 'active'
  )
);

-- Not: get_my_org_id() ve get_my_role() SECURITY DEFINER RPC fonksiyonlarıdır
-- Bu sayede RLS içinde organizasyon ID'si güvenli bir şekilde alınabilir
