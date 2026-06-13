-- Migration: Add attachments to tasks
-- Description: Faz 8 için görevlere dış bağlantı (Google Drive, Figma vb.) eklenebilmesi amacıyla JSONB kolonu ekler.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'tasks' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE tasks
      ADD COLUMN attachments JSONB NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;
