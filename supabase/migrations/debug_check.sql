-- Bunu Supabase SQL Editor'da çalıştır ve sonucu paylaş

-- 1. sprints tablosunun kolon listesi
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'sprints'
ORDER BY ordinal_position;

-- 2. tasks tablosunun kolon listesi
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'tasks'
ORDER BY ordinal_position;

-- 3. sprints tablosundaki kayıt sayısı
SELECT COUNT(*) as sprint_count FROM public.sprints;

-- 4. tasks tablosundaki kayıt sayısı  
SELECT COUNT(*) as task_count FROM public.tasks;

-- 5. teams tablosundaki kayıt sayısı
SELECT id, name, course_id FROM public.teams LIMIT 5;
