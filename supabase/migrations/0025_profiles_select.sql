-- 0025_profiles_select.sql
-- profiles tablosuna geçici açık SELECT policy
-- TODO: Sonra org-izole edilecek (sadece aynı org kullanıcıları görsün)

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
DROP POLICY IF EXISTS "profiles_select_same_org" ON profiles;

-- Geçici olarak herkes herkesi görebilir (test için)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
