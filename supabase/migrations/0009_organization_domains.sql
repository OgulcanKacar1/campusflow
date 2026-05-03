-- ============================================================
-- 0009_organization_domains.sql
-- AMAÇ: Organizasyonların birden fazla domaine sahip olabilmesi
-- ve domainlere göre otomatik rol atanabilmesi.
-- Örn: @isik.edu.tr -> student, @isikun.edu.tr -> instructor
-- ============================================================

-- 1. organization_domains tablosu oluşturulur
CREATE TABLE organization_domains (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  domain TEXT NOT NULL UNIQUE,
  role_hint TEXT NOT NULL DEFAULT 'student' CHECK (role_hint IN ('student', 'instructor', 'admin', 'any')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_organization_domains_org ON organization_domains(organization_id);
CREATE INDEX idx_organization_domains_domain ON organization_domains(domain);

-- 2. Mevcut organizasyonların domainlerini yeni tabloya taşı
INSERT INTO organization_domains (organization_id, domain, role_hint)
SELECT id, domain, 'student' FROM organizations
ON CONFLICT (domain) DO NOTHING;

-- campusflow.io domaini için role_hint'i admin veya any yapabiliriz
UPDATE organization_domains 
SET role_hint = 'any' 
WHERE domain = 'campusflow.io';

-- 3. handle_new_user trigger'ını güncelle
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_organization_id UUID;
  v_org_status TEXT;
  v_role_hint TEXT;
  v_assigned_role TEXT;
BEGIN
  -- 1. VIP KAPISI: Ogulcan için özel kural
  IF new.email = 'ogulcankacarr@gmail.com' THEN
    -- Onu ana organizasyona (campusflow.io) bağla
    SELECT id INTO v_organization_id FROM organizations WHERE domain = 'campusflow.io' LIMIT 1;
    
    INSERT INTO public.profiles (id, email, full_name, role, organization_id)
    VALUES (
      new.id, 
      new.email, 
      COALESCE(new.raw_user_meta_data->>'full_name', 'Süper Admin'), 
      'super_admin', 
      v_organization_id
    );
    RETURN new;
  END IF;

  -- 2. NORMAL KAPI: Üniversite mailleri için kontrol
  SELECT o.id, o.status, od.role_hint 
  INTO v_organization_id, v_org_status, v_role_hint
  FROM organization_domains od
  JOIN organizations o ON o.id = od.organization_id
  WHERE od.domain = split_part(new.email, '@', 2)
  LIMIT 1;

  -- Organizasyon bulunamadıysa veya suspended ise kayıt olmaz
  IF v_organization_id IS NULL OR v_org_status = 'suspended' THEN
    RETURN new; -- profiles'a yazmadan sessizce çık
  END IF;

  -- Lisans limiti kontrolü (sadece öğrenciler için)
  -- Eğer atanacak rol instructor veya admin ise öğrenci limitine takılmaz
  v_assigned_role := CASE WHEN v_role_hint = 'any' THEN 'student' ELSE v_role_hint END;

  IF v_assigned_role = 'student' AND (
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

  -- Kullanıcıyı profiles tablosuna ekle
  INSERT INTO public.profiles (id, email, full_name, role, organization_id)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'İsimsiz Kullanıcı'),
    v_assigned_role,
    v_organization_id
  );

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. RLS ve GRANT Ayarları
ALTER TABLE organization_domains ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_domains TO authenticated;
GRANT SELECT ON public.organization_domains TO anon;

-- Super Admin her şeyi görür ve yönetir
CREATE POLICY "org_domains_super_admin" ON organization_domains FOR ALL USING (
  get_my_role() = 'super_admin'
);

-- Admin kendi organizasyonunun domainlerini görebilir
CREATE POLICY "org_domains_admin_select" ON organization_domains FOR SELECT USING (
  organization_id = get_my_org_id()
);

-- Herkes kayıt olurken domain kontrolü yapmak zorunda olduğu için public okuma izni
-- handle_new_user SECURITY DEFINER olduğu için trigger içinde public okuma iznine gerek yok,
-- ancak client tarafında (örneğin login formunda "bu domain destekleniyor mu?" kontrolü için)
-- okuma izni faydalı olabilir. Şimdilik sadece anon/authenticated için sadece domain adını görme izni:
CREATE POLICY "org_domains_public_read" ON organization_domains FOR SELECT USING (true);
