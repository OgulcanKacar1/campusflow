-- ============================================================================
-- Phase 2C: Ders Yönetimi - Join Code Güncellemesi
-- ============================================================================

-- 1. COURSES Tablosuna join_code Ekleme
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS join_code TEXT UNIQUE;

-- Var olan derslere (eğer varsa) rastgele join code atayalım ki null kalmasın
UPDATE public.courses
SET join_code = upper(substring(md5(random()::text) from 1 for 6))
WHERE join_code IS NULL;

-- 2. Öğrencilerin katılım koduyla ders bulabilmesi için özel bir fonksiyon (RPC) yazıyoruz.
-- Normalde öğrenciler RLS'den dolayı kayıtlı olmadıkları dersi göremezler. 
-- Bu fonksiyon RLS'i pas geçerek "sadece şifresi (join_code) bilinen dersin ID'sini" döndürür.
CREATE OR REPLACE FUNCTION public.get_course_by_join_code(p_join_code TEXT)
RETURNS UUID AS $$
DECLARE
    v_course_id UUID;
    v_org_id UUID;
BEGIN
    -- Kullanıcının organizasyonunu bul
    SELECT organization_id INTO v_org_id 
    FROM public.profiles 
    WHERE id = auth.uid();

    -- Sadece o organizasyona ait ve aktif olan, join_code'u eşleşen dersi bul
    SELECT id INTO v_course_id 
    FROM public.courses 
    WHERE join_code = p_join_code 
      AND status = 'active'
      AND organization_id = v_org_id;
      
    RETURN v_course_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_course_by_join_code(TEXT) TO authenticated;
