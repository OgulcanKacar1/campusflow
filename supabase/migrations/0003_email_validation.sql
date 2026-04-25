-- 0003_email_validation.sql
-- Sadece üniversite maili (.edu.tr) ile kaydı zorunlu kılan güvenlik trigger'ı

CREATE OR REPLACE FUNCTION check_edu_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email NOT LIKE '%.edu.tr' THEN
    RAISE EXCEPTION 'CampusFlow sadece .edu.tr uzantılı kurumsal üniversite mailleri ile kullanılabilir.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_edu_email
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION check_edu_email();
