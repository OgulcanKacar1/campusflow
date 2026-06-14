-- Bildirimler için frontend yönlendirmesini kolaylaştıran 'link' sütunu ekleme
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link TEXT;

-- Realtime özelliğini açma
-- (Zaten 'supabase_realtime' publication var varsayarak ona ekliyoruz)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
    END IF;
END
$$;

-- Güvenlik Politikaları (RLS)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Eğer mevcut politikalar varsa önce düşürüp temizleyelim (hata almamak için)
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Kullanıcı sadece kendi bildirimlerini görebilir
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Kullanıcı sadece kendi bildirimlerini okundu olarak güncelleyebilir
CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Sistem insert edebilsin diye anon veya authenticated izin vermiyoruz, sadece backend'de service role kullanacağız.
