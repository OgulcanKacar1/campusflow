-- 0028_grants.sql
-- Tablo izinleri (grants)

GRANT SELECT, INSERT, UPDATE, DELETE ON team_members TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON teams TO authenticated;
