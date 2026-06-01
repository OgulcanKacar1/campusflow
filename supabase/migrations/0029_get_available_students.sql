-- 0029_get_available_students.sql
-- Derste takımsız kalan öğrencileri getir

CREATE OR REPLACE FUNCTION get_available_students_for_team(
  p_course_id UUID,
  p_exclude_team_id UUID DEFAULT NULL
)
RETURNS TABLE (
  student_id UUID,
  full_name TEXT,
  email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.email
  FROM profiles p
  INNER JOIN course_enrollments ce ON ce.student_id = p.id
  WHERE ce.course_id = p_course_id
    AND ce.status = 'enrolled'
    -- Bu dersteki hiçbir takımda aktif üye değil
    AND NOT EXISTS (
      SELECT 1 
      FROM team_members tm
      JOIN teams t ON t.id = tm.team_id
      WHERE tm.student_id = p.id
        AND t.course_id = p_course_id
        AND tm.left_at IS NULL
    )
  ORDER BY p.full_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_available_students_for_team(UUID, UUID) TO authenticated;
