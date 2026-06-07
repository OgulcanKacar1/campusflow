-- 0031_student_team_mode.sql
-- Student-led takım oluşturma ve davet kodu ile takıma katılma yardımcı fonksiyonları

DROP FUNCTION IF EXISTS public.generate_student_invite_code(INT);
CREATE OR REPLACE FUNCTION public.generate_student_invite_code(p_length INT DEFAULT 6)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_chars CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_result TEXT := '';
  v_index INT;
BEGIN
  IF p_length < 1 THEN
    RAISE EXCEPTION 'Geçersiz davet kodu uzunluğu';
  END IF;

  FOR v_index IN 1..p_length LOOP
    v_result := v_result || substr(v_chars, floor(random() * length(v_chars))::INT + 1, 1);
  END LOOP;

  RETURN v_result;
END;
$$;

DROP FUNCTION IF EXISTS public.student_create_team(UUID, TEXT);
CREATE OR REPLACE FUNCTION public.student_create_team(
  p_course_id UUID,
  p_team_name TEXT DEFAULT NULL
)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  invite_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course RECORD;
  v_team_id UUID;
  v_invite_code TEXT;
  v_name TEXT := COALESCE(NULLIF(trim(p_team_name), ''), 'Yeni Takım');
BEGIN
  SELECT id, team_mode
  INTO v_course
  FROM courses
  WHERE id = p_course_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ders bulunamadı';
  END IF;

  IF v_course.team_mode IS DISTINCT FROM 'student' THEN
    RAISE EXCEPTION 'Bu ders öğrenci tarafından takım oluşturmayı desteklemiyor';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM course_enrollments
    WHERE course_id = p_course_id
      AND student_id = auth.uid()
      AND status = 'enrolled'
  ) THEN
    RAISE EXCEPTION 'Bu derse kayıtlı değilsiniz';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.course_id = p_course_id
      AND tm.student_id = auth.uid()
      AND tm.left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Bu derste zaten bir takımdasınız';
  END IF;

  LOOP
    v_invite_code := generate_student_invite_code();
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM teams t WHERE t.invite_code = v_invite_code
    );
  END LOOP;

  INSERT INTO teams AS t (course_id, name, status, created_by, invite_code)
  VALUES (p_course_id, v_name, 'active', auth.uid(), v_invite_code)
  RETURNING id INTO v_team_id;

  INSERT INTO team_members (team_id, student_id, role)
  VALUES (v_team_id, auth.uid(), 'leader');

  RETURN QUERY
  SELECT v_team_id AS team_id, v_name AS team_name, v_invite_code AS invite_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.student_create_team(UUID, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.student_join_team_by_invite(TEXT);
CREATE OR REPLACE FUNCTION public.student_join_team_by_invite(
  p_invite_code TEXT
)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  invite_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team RECORD;
  v_member_count INT;
BEGIN
  IF p_invite_code IS NULL OR length(trim(p_invite_code)) = 0 THEN
    RAISE EXCEPTION 'Geçersiz davet kodu';
  END IF;

  SELECT t.id,
         t.name,
         t.course_id,
         c.team_mode,
         c.team_max_size,
         t.invite_code
  INTO v_team
  FROM teams t
  JOIN courses c ON c.id = t.course_id
  WHERE t.invite_code = trim(p_invite_code);

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Davet kodu bulunamadı';
  END IF;

  IF v_team.team_mode IS DISTINCT FROM 'student' THEN
    RAISE EXCEPTION 'Bu takım davet kodu ile katılıma kapalı';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM course_enrollments
    WHERE course_id = v_team.course_id
      AND student_id = auth.uid()
      AND status = 'enrolled'
  ) THEN
    RAISE EXCEPTION 'Bu derse kayıtlı değilsiniz';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM team_members tm_existing
    JOIN teams t_existing ON t_existing.id = tm_existing.team_id
    WHERE t_existing.course_id = v_team.course_id
      AND tm_existing.student_id = auth.uid()
      AND tm_existing.left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Bu derste zaten bir takımdasınız';
  END IF;

  SELECT COUNT(*)
  INTO v_member_count
  FROM team_members tm_count
  WHERE tm_count.team_id = v_team.id
    AND tm_count.left_at IS NULL;

  IF v_team.team_max_size IS NOT NULL AND v_member_count >= v_team.team_max_size THEN
    RAISE EXCEPTION 'Takım dolu';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM team_members tm_rejoin
    WHERE tm_rejoin.team_id = v_team.id
      AND tm_rejoin.student_id = auth.uid()
      AND tm_rejoin.left_at IS NOT NULL
  ) THEN
    UPDATE team_members tm_update
    SET left_at = NULL,
        joined_at = NOW(),
        role = COALESCE(tm_update.role, 'member')
    WHERE tm_update.team_id = v_team.id
      AND tm_update.student_id = auth.uid();

    RETURN QUERY
    SELECT v_team.id AS team_id, v_team.name AS team_name, v_team.invite_code AS invite_code;
    RETURN;
  END IF;

  INSERT INTO team_members (team_id, student_id, role)
  VALUES (v_team.id, auth.uid(), 'member');

  RETURN QUERY
  SELECT v_team.id AS team_id, v_team.name AS team_name, v_team.invite_code AS invite_code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.student_join_team_by_invite(TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.student_leave_team(UUID);
CREATE OR REPLACE FUNCTION public.student_leave_team(
  p_team_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_course_id UUID;
  v_team_mode TEXT;
  v_remaining INT;
BEGIN
  SELECT t.course_id, c.team_mode
  INTO v_course_id, v_team_mode
  FROM teams t
  JOIN courses c ON c.id = t.course_id
  WHERE t.id = p_team_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Takım bulunamadı';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM team_members tm
    WHERE tm.team_id = p_team_id
      AND tm.student_id = auth.uid()
      AND tm.left_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Bu takımın aktif üyesi değilsiniz';
  END IF;

  UPDATE team_members
  SET left_at = NOW()
  WHERE team_id = p_team_id
    AND student_id = auth.uid()
    AND left_at IS NULL;

  IF v_team_mode = 'student' THEN
    SELECT COUNT(*)
    INTO v_remaining
    FROM team_members tm_remaining
    WHERE tm_remaining.team_id = p_team_id
      AND tm_remaining.left_at IS NULL;

    IF v_remaining = 0 THEN
      DELETE FROM teams WHERE id = p_team_id;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.student_leave_team(UUID) TO authenticated;
