-- ============================================================
-- 0006_multi_tenant.sql
-- AMAÇ: Farklı üniversitelerin birbirinin verisini görmesini
-- engellemek için domain bazlı güvenlik katmanı.
--
-- DEĞİŞİKLİKLER:
-- 1. profiles tablosuna university_domain sütunu eklenir
--    (email'den otomatik üretilir, elle değiştirilemez)
-- 2. Email değişikliği engellenir
-- 3. profiles SELECT policy güncellenir (herkes → aynı domain)
-- 4. profiles UPDATE policy güncellenir (admin yetki sınırı)
-- 5. courses SELECT policy güncellenir (herkes → aynı domain)
-- ============================================================


-- 1. university_domain sütunu
-- 'ali@itu.edu.tr' → university_domain = 'itu.edu.tr'
-- GENERATED ALWAYS: elle değiştirilemez, email'den türetilir
-- STORED: fiziksel olarak saklanır, index'lenebilir
ALTER TABLE profiles ADD COLUMN university_domain TEXT
  GENERATED ALWAYS AS (split_part(email, '@', 2)) STORED;

CREATE INDEX idx_profiles_domain ON profiles(university_domain);


-- 2. Email değişikliğini engelle
-- Biri email'ini değiştirerek başka üniversitenin
-- domain'ine geçemesin. university_domain da değişir
-- çünkü GENERATED ALWAYS ile email'e bağlı.
CREATE OR REPLACE FUNCTION prevent_email_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email != OLD.email THEN
    RAISE EXCEPTION 'Email değiştirilemez';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_email_change
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION prevent_email_change();


-- 3. Profil izolasyonu
-- ESKİ: Herkes herkesi görebiliyordu (USING true)
-- YENİ: Sadece aynı üniversitedekiler birbirini görür
DROP POLICY "profiles_select_all" ON profiles;

CREATE POLICY "profiles_select_same_domain" ON profiles FOR SELECT USING (
  university_domain = (
    SELECT university_domain FROM profiles WHERE id = auth.uid()
  )
);


-- 4. Admin yetki sınırı
-- ESKİ: Kullanıcı sadece kendi profilini güncelleyebiliyordu
-- YENİ: Admin kendi domainindeki herkesi güncelleyebilir
--       (rol değiştirme: student → instructor gibi)
DROP POLICY "profiles_update_self" ON profiles;

CREATE POLICY "profiles_update_self_or_admin" ON profiles FOR UPDATE USING (
  id = auth.uid()
  OR (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND university_domain = (
      SELECT university_domain FROM profiles WHERE id = auth.uid()
    )
  )
) WITH CHECK (
  id = auth.uid()
  OR (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND university_domain = (
      SELECT university_domain FROM profiles WHERE id = auth.uid()
    )
  )
);


-- 5. Ders izolasyonu
-- ESKİ: Herkes tüm dersleri görebiliyordu (USING true)
-- YENİ: Sadece kendi üniversitesinin derslerini görür
-- Dersin hangi üniversiteye ait olduğu hocanın domain'inden anlaşılır
DROP POLICY "courses_select_all" ON courses;

CREATE POLICY "courses_select_same_domain" ON courses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = instructor_id
    AND university_domain = (
      SELECT university_domain FROM profiles WHERE id = auth.uid()
    )
  )
);


-- 6. Öğrenci cross-domain kayıt engeli
-- ESKİ: Öğrenci herhangi bir derse kaydolabiliyordu
-- YENİ: Sadece kendi üniversitesinin derslerine kaydolabilir
-- Örn: ITÜ öğrencisi ODTÜ'nün dersine kayıt olamaz
DROP POLICY "enrollment_insert_student" ON course_enrollments;

CREATE POLICY "enrollment_insert_student" ON course_enrollments FOR INSERT WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student'
  )
  AND EXISTS (
    SELECT 1 FROM courses c
    JOIN profiles p ON p.id = c.instructor_id
    WHERE c.id = course_id
    AND p.university_domain = (
      SELECT university_domain FROM profiles WHERE id = auth.uid()
    )
  )
);
