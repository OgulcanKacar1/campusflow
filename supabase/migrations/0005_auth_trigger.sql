-- 0005_auth_trigger.sql
-- Yeni bir kullanıcı sisteme kayıt olduğunda, Supabase'in 'auth.users' tablosundan 
-- bizim kendi 'profiles' tablomuza veriyi güvenli bir şekilde aktaran trigger.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    -- Frontend'den signUp(options: { data: { full_name } }) ile gönderilen isim
    COALESCE(new.raw_user_meta_data->>'full_name', 'İsimsiz Kullanıcı'),
    'student' -- Varsayılan rol her zaman öğrenci
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sadece insert olduğunda tetiklenir
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
