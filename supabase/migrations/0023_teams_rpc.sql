-- 0023_teams_rpc.sql
-- RLS bypass için SECURITY DEFINER RPC fonksiyonları

-- 1. Takım oluştur (instructor kontrolü server-side)
CREATE OR REPLACE FUNCTION create_team(
  p_course_id UUID,
  p_name TEXT,
  p_repo_url TEXT DEFAULT NULL
)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  course_id UUID,
  repo_url TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Instructor kontrolü
  IF NOT EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = p_course_id
    AND c.instructor_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bu ders için takım oluşturma yetkiniz yok';
  END IF;

  RETURN QUERY
  INSERT INTO teams (course_id, name, repo_url, status, created_by)
  VALUES (p_course_id, p_name, p_repo_url, 'active', auth.uid())
  RETURNING teams.id, teams.name, teams.course_id, teams.repo_url, teams.status, teams.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_team(UUID, TEXT, TEXT) TO authenticated;

-- 2. Rastgele takımlar oluştur
CREATE OR REPLACE FUNCTION create_random_teams(
  p_course_id UUID,
  p_team_size INT,
  p_prefix TEXT DEFAULT 'Takım'
)
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  member_count BIGINT
) AS $$
DECLARE
  v_student_ids UUID[];
  v_team_id UUID;
  v_team_name TEXT;
  v_i INT;
  v_offset INT;
BEGIN
  -- Instructor kontrolü
  IF NOT EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = p_course_id
    AND c.instructor_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bu ders için takım oluşturma yetkiniz yok';
  END IF;

  -- Derse kayıtlı ve henüz hiçbir takımda olmayan öğrencileri al
  SELECT ARRAY_AGG(ce.student_id)
  INTO v_student_ids
  FROM course_enrollments ce
  WHERE ce.course_id = p_course_id
  AND ce.status = 'enrolled'
  AND NOT EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE t.course_id = p_course_id
    AND tm.student_id = ce.student_id
  );

  IF v_student_ids IS NULL OR array_length(v_student_ids, 1) IS NULL THEN
    RETURN; -- Boş dön, hata değil
  END IF;

  -- Fisher-Yates shuffle
  FOR v_i IN 1..array_length(v_student_ids, 1) - 1 LOOP
    DECLARE
      v_j INT := floor(random() * (array_length(v_student_ids, 1) - v_i + 1))::INT + v_i;
      v_temp UUID;
    BEGIN
      v_temp := v_student_ids[v_i];
      v_student_ids[v_i] := v_student_ids[v_j];
      v_student_ids[v_j] := v_temp;
    END;
  END LOOP;

  -- Gruplara böl ve takımlar oluştur
  v_i := 1;
  WHILE v_i <= array_length(v_student_ids, 1) LOOP
    v_team_name := p_prefix || ' ' || ((v_i - 1) / p_team_size + 1)::TEXT;
    
    INSERT INTO teams (course_id, name, status, created_by)
    VALUES (p_course_id, v_team_name, 'active', auth.uid())
    RETURNING id INTO v_team_id;

    -- Bu gruptaki öğrencileri ekle
    FOR v_offset IN 0..p_team_size - 1 LOOP
      IF v_i + v_offset <= array_length(v_student_ids, 1) THEN
        INSERT INTO team_members (team_id, student_id, role)
        VALUES (v_team_id, v_student_ids[v_i + v_offset], 'member');
      END IF;
    END LOOP;

    v_i := v_i + p_team_size;

    RETURN QUERY SELECT v_team_id, v_team_name, 
      (SELECT COUNT(*) FROM team_members tm WHERE tm.team_id = v_team_id)::BIGINT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION create_random_teams(UUID, INT, TEXT) TO authenticated;

-- 3. Takım güncelle
CREATE OR REPLACE FUNCTION update_team(
  p_team_id UUID,
  p_name TEXT DEFAULT NULL,
  p_repo_url TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_course_id UUID;
BEGIN
  SELECT t.course_id INTO v_course_id
  FROM teams t
  WHERE t.id = p_team_id;

  IF NOT EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = v_course_id
    AND c.instructor_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bu takımı güncelleme yetkiniz yok';
  END IF;

  UPDATE teams
  SET name = COALESCE(p_name, name),
      repo_url = COALESCE(p_repo_url, repo_url),
      status = COALESCE(p_status, status)
  WHERE id = p_team_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_team(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- 4. Takım sil
CREATE OR REPLACE FUNCTION delete_team(p_team_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_course_id UUID;
BEGIN
  SELECT t.course_id INTO v_course_id
  FROM teams t
  WHERE t.id = p_team_id;

  IF NOT EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = v_course_id
    AND c.instructor_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bu takımı silme yetkiniz yok';
  END IF;

  -- team_members CASCADE ile silinecek
  DELETE FROM teams WHERE id = p_team_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION delete_team(UUID) TO authenticated;

-- 5. Takıma üye ekle
CREATE OR REPLACE FUNCTION add_team_member(
  p_team_id UUID,
  p_student_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_course_id UUID;
  v_team_max_size INT;
  v_member_count INT;
  v_existing_member_id UUID;
  v_existing_left_at TIMESTAMPTZ;
BEGIN
  SELECT t.course_id, c.team_max_size
  INTO v_course_id, v_team_max_size
  FROM teams t
  JOIN courses c ON c.id = t.course_id
  WHERE t.id = p_team_id;

  IF NOT EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = v_course_id
    AND c.instructor_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bu takıma üye ekleme yetkiniz yok';
  END IF;

  -- Öğrenci bu dersteki başka bir takımda aktif üye mi kontrol et
  IF EXISTS (
    SELECT 1 FROM team_members tm
    JOIN teams t ON t.id = tm.team_id
    WHERE tm.student_id = p_student_id
    AND t.course_id = v_course_id
    AND tm.left_at IS NULL
    AND tm.team_id != p_team_id
  ) THEN
    RAISE EXCEPTION 'Öğrenci bu derste zaten başka bir takımda aktif üye';
  END IF;

  SELECT tm.id, tm.left_at
  INTO v_existing_member_id, v_existing_left_at
  FROM team_members tm
  WHERE tm.team_id = p_team_id
    AND tm.student_id = p_student_id
  ORDER BY tm.joined_at DESC
  LIMIT 1;

  IF v_existing_member_id IS NOT NULL THEN
    IF v_existing_left_at IS NULL THEN
      RAISE EXCEPTION 'Bu öğrenci zaten bu takımda';
    END IF;

    SELECT COUNT(*)
    INTO v_member_count
    FROM team_members tm
    WHERE tm.team_id = p_team_id
      AND tm.left_at IS NULL;

    IF v_team_max_size IS NOT NULL AND v_member_count >= v_team_max_size THEN
      RAISE EXCEPTION 'Takım dolu';
    END IF;

    UPDATE team_members
    SET left_at = NULL,
        joined_at = NOW(),
        role = 'member'
    WHERE id = v_existing_member_id;

    RETURN TRUE;
  END IF;

  SELECT COUNT(*)
  INTO v_member_count
  FROM team_members tm
  WHERE tm.team_id = p_team_id
    AND tm.left_at IS NULL;

  IF v_team_max_size IS NOT NULL AND v_member_count >= v_team_max_size THEN
    RAISE EXCEPTION 'Takım dolu';
  END IF;

  INSERT INTO team_members (team_id, student_id, role)
  VALUES (p_team_id, p_student_id, 'member');

  RETURN TRUE;
EXCEPTION
  WHEN unique_violation THEN
    RAISE EXCEPTION 'Bu öğrenci zaten bu takımda';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION add_team_member(UUID, UUID) TO authenticated;

-- 5.5. Takımdan üye çıkar (soft delete)
CREATE OR REPLACE FUNCTION remove_team_member(
  p_team_id UUID,
  p_student_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_course_id UUID;
BEGIN
  SELECT t.course_id INTO v_course_id
  FROM teams t
  WHERE t.id = p_team_id;

  IF NOT EXISTS (
    SELECT 1 FROM courses c
    WHERE c.id = v_course_id
    AND c.instructor_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Bu takımdan üye çıkarma yetkiniz yok';
  END IF;

  UPDATE team_members
  SET left_at = NOW()
  WHERE team_id = p_team_id
  AND student_id = p_student_id
  AND left_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Üye bulunamadı veya zaten çıkarılmış';
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION remove_team_member(UUID, UUID) TO authenticated;
