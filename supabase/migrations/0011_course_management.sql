-- ============================================================================
-- Phase 2B: Ders Yönetimi - Multi-Tenant Güncellemesi
-- ============================================================================

-- 1. COURSES Tablosuna organization_id Ekleme
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE;

-- Mevcut dersler varsa (şu an boş ama yine de), organization_id değerini hocanın profiline göre doldur
UPDATE public.courses c
SET organization_id = p.organization_id
FROM public.profiles p
WHERE c.instructor_id = p.id AND c.organization_id IS NULL;

-- Artık organization_id boş olamaz
ALTER TABLE public.courses 
ALTER COLUMN organization_id SET NOT NULL;

-- 2. RLS Açma (Eğer kapalıysa)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_enrollments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLITIKALARI: courses
-- (Eski politikalar varsa çakışmaması için önce silinebilir, 
--  ama 0002_rls_policies içinde courses RLS'leri varsa DROP yapmamız lazım)
-- ============================================================================
DROP POLICY IF EXISTS "Super Admins can view all courses" ON public.courses;
DROP POLICY IF EXISTS "Super Admins can manage all courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can view their org courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can manage their org courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can view their org courses" ON public.courses;
DROP POLICY IF EXISTS "Instructors can create courses for their org" ON public.courses;
DROP POLICY IF EXISTS "Instructors can update their own courses" ON public.courses;
DROP POLICY IF EXISTS "Students can view active org courses" ON public.courses;

-- (0002'den kalan muhtemel eski kurallar)
DROP POLICY IF EXISTS "Hocalar kendi derslerini gorebilir" ON public.courses;
DROP POLICY IF EXISTS "Hocalar ders olusturabilir" ON public.courses;
DROP POLICY IF EXISTS "Hocalar kendi derslerini silebilir" ON public.courses;
DROP POLICY IF EXISTS "Ogrenciler aktif dersleri gorebilir" ON public.courses;


-- Super Admin her dersi görür
CREATE POLICY "Super Admins can view all courses" 
ON public.courses FOR SELECT 
USING (get_my_role() = 'super_admin');

-- Super Admin her dersi düzenleyebilir
CREATE POLICY "Super Admins can manage all courses" 
ON public.courses FOR ALL 
USING (get_my_role() = 'super_admin');

-- Okul Admini sadece kendi okulundaki dersleri görür
CREATE POLICY "Admins can view their org courses" 
ON public.courses FOR SELECT 
USING (
  get_my_role() = 'admin' 
  AND organization_id = get_my_org_id()
);

-- Okul Admini kendi okulunda ders oluşturabilir/silebilir
CREATE POLICY "Admins can manage their org courses" 
ON public.courses FOR ALL 
USING (
  get_my_role() = 'admin' 
  AND organization_id = get_my_org_id()
);

-- Hoca kendi verdiği veya kendi okulundaki dersleri görebilir
CREATE POLICY "Instructors can view their org courses" 
ON public.courses FOR SELECT 
USING (
  get_my_role() = 'instructor' 
  AND organization_id = get_my_org_id()
);

-- Hoca sadece kendi okuluna yeni ders açabilir
CREATE POLICY "Instructors can create courses for their org" 
ON public.courses FOR INSERT 
WITH CHECK (
  get_my_role() = 'instructor' 
  AND organization_id = get_my_org_id()
  AND instructor_id = auth.uid()
);

-- Hoca sadece KENDİ açtığı dersi güncelleyebilir
CREATE POLICY "Instructors can update their own courses" 
ON public.courses FOR UPDATE 
USING (
  get_my_role() = 'instructor' 
  AND instructor_id = auth.uid()
);

-- Öğrenci sadece aktif olan ve kendi okuluna ait dersleri görebilir
CREATE POLICY "Students can view active org courses" 
ON public.courses FOR SELECT 
USING (
  get_my_role() = 'student' 
  AND organization_id = get_my_org_id()
  AND status = 'active'
);

-- ============================================================================
-- RLS POLITIKALARI: course_enrollments
-- ============================================================================
DROP POLICY IF EXISTS "Super Admins can view all enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins can view their org enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Admins can manage their org enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Instructors can manage their course enrollments" ON public.course_enrollments;
DROP POLICY IF EXISTS "Students can view their own enrollments" ON public.course_enrollments;

-- (0002'den kalan muhtemel eski kurallar)
DROP POLICY IF EXISTS "Ogrenciler kendi kayitlarini gorebilir" ON public.course_enrollments;
DROP POLICY IF EXISTS "Hocalar verdikleri dersin kayitlarini gorebilir" ON public.course_enrollments;


-- Super Admin her kaydı görür
CREATE POLICY "Super Admins can view all enrollments" 
ON public.course_enrollments FOR SELECT 
USING (get_my_role() = 'super_admin');

-- Admin sadece kendi okulunun derslerindeki kayıtları görür
CREATE POLICY "Admins can view their org enrollments" 
ON public.course_enrollments FOR SELECT 
USING (
  get_my_role() = 'admin' 
  AND course_id IN (SELECT id FROM public.courses WHERE organization_id = get_my_org_id())
);

-- Admin kendi okulu için kayıt ekleyip silebilir
CREATE POLICY "Admins can manage their org enrollments" 
ON public.course_enrollments FOR ALL 
USING (
  get_my_role() = 'admin' 
  AND course_id IN (SELECT id FROM public.courses WHERE organization_id = get_my_org_id())
);

-- Hoca sadece kendi verdiği dersin kayıtlarını görebilir ve yönetebilir
CREATE POLICY "Instructors can manage their course enrollments" 
ON public.course_enrollments FOR ALL 
USING (
  get_my_role() = 'instructor' 
  AND course_id IN (SELECT id FROM public.courses WHERE instructor_id = auth.uid())
);

-- Öğrenci sadece KENDİ kayıtlarını görebilir
CREATE POLICY "Students can view their own enrollments" 
ON public.course_enrollments FOR SELECT 
USING (
  get_my_role() = 'student' 
  AND student_id = auth.uid()
);
