-- 0062_ai_final_reports_grants.sql
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_final_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_final_reports TO service_role;
