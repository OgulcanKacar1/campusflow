-- 0045_github_integration.sql

-- 1. Create a sequence for task short IDs
CREATE SEQUENCE IF NOT EXISTS task_short_id_seq START 1;

-- 2. Add short_id column to tasks
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS short_id TEXT UNIQUE;

-- 3. Function to auto-generate short_id for new tasks
CREATE OR REPLACE FUNCTION set_task_short_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.short_id IS NULL THEN
        NEW.short_id := 'T-' || nextval('task_short_id_seq');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger for tasks table
DROP TRIGGER IF EXISTS trigger_set_task_short_id ON tasks;
CREATE TRIGGER trigger_set_task_short_id
BEFORE INSERT ON tasks
FOR EACH ROW
EXECUTE FUNCTION set_task_short_id();

-- Populate existing tasks with short_ids
UPDATE tasks SET short_id = 'T-' || nextval('task_short_id_seq') WHERE short_id IS NULL;

-- 5. github_connections Table
CREATE TABLE IF NOT EXISTS github_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    repo_full_name TEXT NOT NULL,
    access_token TEXT NOT NULL,
    webhook_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(team_id)
);

DROP TRIGGER IF EXISTS set_github_connections_updated_at ON github_connections;
CREATE TRIGGER set_github_connections_updated_at
    BEFORE UPDATE ON github_connections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. task_github_events Table
CREATE TABLE IF NOT EXISTS task_github_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL, -- 'commit', 'pr_opened', 'pr_merged'
    commit_hash TEXT,
    pr_number INTEGER,
    author_username TEXT,
    author_name TEXT,
    message TEXT,
    url TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Add to realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'github_connections'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE github_connections;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'task_github_events'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE task_github_events;
    END IF;
END $$;

-- 8. Row Level Security (RLS)
ALTER TABLE github_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_github_events ENABLE ROW LEVEL SECURITY;

-- Allow instructors to read github_connections
CREATE POLICY "Instructors can view team github connections"
ON github_connections FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM teams t
        JOIN courses c ON t.course_id = c.id
        WHERE t.id = github_connections.team_id
        AND c.instructor_id = auth.uid()
    )
);

-- Allow students to read github_connections of their team (so they know it's connected)
CREATE POLICY "Students can view their team github connections"
ON github_connections FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM team_members tm
        WHERE tm.team_id = github_connections.team_id
        AND tm.student_id = auth.uid()
    )
);

-- Note: We do NOT create INSERT/UPDATE policies for clients.
-- GitHub connections and events will be managed securely via Server Actions (Service Role) and Webhooks.

-- Allow team members to view github events for their tasks
CREATE POLICY "Users can view github events for their team tasks"
ON task_github_events FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN team_members tm ON t.team_id = tm.team_id
        WHERE t.id = task_github_events.task_id
        AND tm.student_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM tasks t
        JOIN teams tm ON t.team_id = tm.id
        JOIN courses c ON tm.course_id = c.id
        WHERE t.id = task_github_events.task_id
        AND c.instructor_id = auth.uid()
    )
);
