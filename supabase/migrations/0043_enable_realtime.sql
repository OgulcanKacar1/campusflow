-- 0043_enable_realtime.sql
-- Enable Supabase Realtime for Kanban tables

DO $$
BEGIN
    -- Add 'tasks' to publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'tasks'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
    END IF;

    -- Add 'sprints' to publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'sprints'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE sprints;
    END IF;
END $$;
