-- 0003_email_validation.sql
-- Sadece üniversite maili (.edu.tr) ile kaydı zorunlu kılan güvenlik trigger'ı

CREATE OR REPLACE FUNCTION check_edu_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer mail ogulcankacarr@gmail.com ise veya .edu.tr ile bitiyorsa izin ver
  IF NEW.email = 'ogulcankacarr@gmail.com' OR NEW.email LIKE '%.edu.tr' THEN
    RETURN NEW;
  END IF;

  -- Diğer durumlarda hata fırlat
  RAISE EXCEPTION 'CampusFlow sadece .edu.tr uzantılı kurumsal üniversite mailleri ile kullanılabilir.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_edu_email
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION check_edu_email();
