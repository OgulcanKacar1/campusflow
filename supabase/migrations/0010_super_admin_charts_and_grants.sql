-- ============================================================
-- 0010_super_admin_charts_and_grants.sql
-- AMAÇ: Super Admin Dashboard grafikleri için RPC fonksiyonu
-- ve eksik tablo okuma yetkilerinin (GRANT) eklenmesi.
-- ============================================================

-- 1. Eksik Kalan İzinler (Grants)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations TO authenticated;
GRANT SELECT ON public.organizations TO anon;

GRANT SELECT ON public.super_admin_stats TO authenticated;
GRANT SELECT ON public.super_admin_stats TO anon;

-- 2. Kayıt Trendi Grafiği için RPC Fonksiyonu
CREATE OR REPLACE FUNCTION get_registration_trend(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  date TEXT,
  student_count BIGINT,
  instructor_count BIGINT,
  admin_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(
      CURRENT_DATE - (days_back - 1) * INTERVAL '1 day',
      CURRENT_DATE,
      INTERVAL '1 day'
    )::DATE AS d
  )
  SELECT 
    to_char(dates.d, 'DD Mon YYYY') AS date,
    COUNT(p.id) FILTER (WHERE p.role = 'student')::BIGINT AS student_count,
    COUNT(p.id) FILTER (WHERE p.role = 'instructor')::BIGINT AS instructor_count,
    COUNT(p.id) FILTER (WHERE p.role = 'admin')::BIGINT AS admin_count
  FROM dates
  LEFT JOIN profiles p ON p.created_at::DATE = dates.d
  GROUP BY dates.d
  ORDER BY dates.d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_registration_trend(INTEGER) TO authenticated;
