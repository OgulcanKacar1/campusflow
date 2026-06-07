-- 0026_open_policies.sql
-- Geçici açık policy'ler (test için)

-- team_members SELECT açık
DROP POLICY IF EXISTS "team_members_select_open" ON team_members;
CREATE POLICY "team_members_select_open" ON team_members FOR SELECT USING (true);

-- team_members INSERT açık (hocanın ekleyebilmesi için)
DROP POLICY IF EXISTS "team_members_insert_open" ON team_members;
CREATE POLICY "team_members_insert_open" ON team_members FOR INSERT WITH CHECK (true);

-- profiles SELECT açık (üye isimleri için)
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
