-- ============================================================
-- 0007_organizations.sql
-- AMAÇ: CampusFlow'u gerçek bir multi-tenant SaaS'a dönüştürmek.
-- Anlaşma yapılan her üniversite bir "organization" olarak
-- sisteme eklenir. Böylece:
-- - Anlaşması biten okul tek satırla askıya alınabilir
-- - Lisans limitleri (max öğrenci, max hoca) takip edilebilir
-- - Sen (süper admin) tüm okulları yönetebilirsin
-- - Okul admini sadece kendi okulunu yönetebilir
--
-- DEĞİŞİKLİKLER:
-- 1. organizations tablosu oluşturulur
-- 2. profiles tablosuna organization_id eklenir
-- 3. handle_new_user trigger'ı güncellenir
--    (kayıt olunca organization_id otomatik dolar)
-- 4. super_admin rolü için RLS policy'leri güncellenir
-- 5. İstatistik view'ları eklenir (admin dashboard için)
-- 6. Askıya alınan okul kullanıcılarını engelleyen RLS eklenir
-- ============================================================


-- 1. organizations tablosu
-- Her anlaşmalı üniversite buraya eklenir
-- Sen (süper admin) bu tabloya service_role ile yazarsın
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,                    -- "İstanbul Teknik Üniversitesi"
  domain TEXT NOT NULL UNIQUE,           -- "itu.edu.tr"
  status TEXT NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'suspended')),
  plan TEXT NOT NULL DEFAULT 'trial'
    CHECK (plan IN ('trial', 'basic', 'premium')),
  trial_ends_at TIMESTAMPTZ,             -- deneme süresi bitiş
  contract_starts_at TIMESTAMPTZ,        -- anlaşma başlangıcı
  contract_ends_at TIMESTAMPTZ,          -- anlaşma bitişi
  max_students INT,                      -- lisans limiti (NULL = sınırsız)
  max_instructors INT,                   -- hoca limiti (NULL = sınırsız)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_organizations_updated_at
BEFORE UPDATE ON organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_organizations_domain ON organizations(domain);
CREATE INDEX idx_organizations_status ON organizations(status);


-- 2. profiles tablosuna organization_id ekle
-- Her kullanıcı hangi okula ait olduğunu bu FK ile bilir
-- RLS artık domain string karşılaştırması yerine
-- bu UUID üzerinden çalışacak (daha sağlam)
ALTER TABLE profiles
  ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_organization ON profiles(organization_id);


-- 3. handle_new_user güncellenir
-- Kullanıcı kayıt olunca email domain'inden organizasyon bulunur
-- ve organization_id otomatik doldurulur.
-- Eğer o domain'de aktif/trial bir organizasyon yoksa
-- profiles'a yazılmaz → anlaşmasız okul sisteme giremez
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_organization_id UUID;
  v_org_status TEXT;
BEGIN
  -- Email domain'inden organizasyonu bul
  SELECT id, status INTO v_organization_id, v_org_status
  FROM organizations
  WHERE domain = split_part(new.email, '@', 2);

  -- Organizasyon bulunamadıysa veya suspended ise kayıt olmaz
  -- (anlaşmasız okul veya askıya alınmış okul)
  IF v_organization_id IS NULL OR v_org_status = 'suspended' THEN
    RETURN new; -- profiles'a yazmadan sessizce çık
  END IF;

  -- Lisans limiti kontrolü (max_students NULL ise sınırsız)
  IF (
    SELECT max_students FROM organizations WHERE id = v_organization_id
  ) IS NOT NULL THEN
    IF (
      SELECT COUNT(*) FROM profiles
      WHERE organization_id = v_organization_id AND role = 'student'
    ) >= (
      SELECT max_students FROM organizations WHERE id = v_organization_id
    ) THEN
      RETURN new; -- Lisans dolmuş, kayıt olmaz
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, organization_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'İsimsiz Kullanıcı'),
    'student',
    v_organization_id
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RLS policy'leri güncellenir
-- Artık domain string karşılaştırması yerine organization_id kullanılır
-- super_admin tüm verilere erişebilir

-- 4a. Profil izolasyonu
DROP POLICY "profiles_select_same_domain" ON profiles;

CREATE POLICY "profiles_select_same_org" ON profiles FOR SELECT USING (
  -- super_admin herkesi görür
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Diğerleri sadece kendi organizasyonunu görür
  organization_id = (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- 4b. Admin ve super_admin yetki güncelleme
DROP POLICY "profiles_update_self_or_admin" ON profiles;

CREATE POLICY "profiles_update_self_or_admin" ON profiles FOR UPDATE USING (
  -- Kullanıcı kendi profilini güncelleyebilir
  id = auth.uid()
  OR
  -- super_admin herkesi güncelleyebilir
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Okul admini sadece kendi organizasyonundakileri güncelleyebilir
  (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
) WITH CHECK (
  id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    AND organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- 4c. Ders izolasyonu
DROP POLICY "courses_select_same_domain" ON courses;

CREATE POLICY "courses_select_same_org" ON courses FOR SELECT USING (
  -- super_admin tüm dersleri görür
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
  OR
  -- Diğerleri sadece kendi organizasyonunun derslerini görür
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = instructor_id
    AND organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- 4d. Öğrenci kayıt izolasyonu
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
    AND p.organization_id = (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  )
);

-- 4e. Askıya alınan okul kullanıcılarını engelle
-- organizations tablosuna RLS ekle
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- super_admin her şeyi görür ve yönetir
CREATE POLICY "organizations_super_admin" ON organizations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  )
);

-- Okul admini sadece kendi organizasyonunu görür
CREATE POLICY "organizations_select_own" ON organizations FOR SELECT USING (
  id = (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);


-- 5. İstatistik view'ları

-- 5a. Süper admin dashboard'u
-- Okul bazlı özet istatistikler
CREATE OR REPLACE VIEW super_admin_stats AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,
  o.domain,
  o.status,
  o.plan,
  o.contract_ends_at,
  COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'student') AS student_count,
  COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'instructor') AS instructor_count,
  COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'admin') AS admin_count,
  COUNT(DISTINCT c.id) AS course_count,
  o.max_students
FROM organizations o
LEFT JOIN profiles p ON p.organization_id = o.id
LEFT JOIN courses c ON c.instructor_id = p.id
GROUP BY o.id, o.name, o.domain, o.status, o.plan, o.contract_ends_at, o.max_students;

-- 5b. Okul admini dashboard'u
-- Kendi okulunun özet istatistikleri
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  o.name AS organization_name,
  o.domain,
  o.status,
  o.plan,
  o.contract_ends_at,
  o.max_students,
  COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'student') AS student_count,
  COUNT(DISTINCT p.id) FILTER (WHERE p.role = 'instructor') AS instructor_count,
  COUNT(DISTINCT c.id) AS course_count,
  COUNT(DISTINCT t.id) AS team_count
FROM organizations o
LEFT JOIN profiles p ON p.organization_id = o.id
LEFT JOIN courses c ON c.instructor_id = p.id
LEFT JOIN teams t ON t.course_id = c.id
WHERE o.id = (
  SELECT organization_id FROM profiles WHERE id = auth.uid()
)
GROUP BY o.name, o.domain, o.status, o.plan, o.contract_ends_at, o.max_students;
