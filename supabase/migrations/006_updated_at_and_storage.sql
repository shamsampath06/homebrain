-- Migration 006: Updated_at triggers, missing indexes, storage policies, and chat history table

-- 1. Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to relevant tables if column exists
DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'profiles',
        'events',
        'groceries',
        'medicines',
        'expenses',
        'bills',
        'family_knowledge',
        'knowledge_files',
        'family_memories',
        'emergency_sessions'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = tbl 
              AND column_name = 'updated_at'
        ) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_update_%I_updated_at ON %I;', tbl, tbl);
            EXECUTE format('CREATE TRIGGER trg_update_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();', tbl, tbl);
        END IF;
    END LOOP;
END;
$$;

-- 2. Add missing recommended indexes
CREATE INDEX IF NOT EXISTS family_memories_family_date_idx ON family_memories(family_id, year DESC, date DESC);
CREATE INDEX IF NOT EXISTS medicines_family_person_idx ON medicines(family_id, person_name);
CREATE INDEX IF NOT EXISTS family_members_family_idx ON family_members(family_id);
CREATE INDEX IF NOT EXISTS family_knowledge_family_cat_idx ON family_knowledge(family_id, category);
CREATE INDEX IF NOT EXISTS medicine_logs_family_time_idx ON medicine_logs(family_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS grocery_history_family_time_idx ON grocery_history(family_id, purchased_at DESC);

-- 3. Persistent Chat Messages Table (for Phase 1 Real AI Chatbot)
CREATE TABLE IF NOT EXISTS chat_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    sender text NOT NULL CHECK (sender IN ('user', 'assistant')),
    text text NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb,
    grounding_sources jsonb DEFAULT '[]'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'chat_messages' AND policyname = 'chat_messages_family_isolation'
    ) THEN
        CREATE POLICY chat_messages_family_isolation ON chat_messages
            FOR ALL
            USING (family_id = current_family_id())
            WITH CHECK (family_id = current_family_id());
    END IF;
END;
$$;

-- 4. Extend family_memories table for Phase 2 (Multiple photos, document attachments, tags, tagged members)
ALTER TABLE family_memories ADD COLUMN IF NOT EXISTS photo_urls jsonb DEFAULT '[]'::jsonb;
ALTER TABLE family_memories ADD COLUMN IF NOT EXISTS document_urls jsonb DEFAULT '[]'::jsonb;
ALTER TABLE family_memories ADD COLUMN IF NOT EXISTS tagged_members jsonb DEFAULT '[]'::jsonb;
ALTER TABLE family_memories ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]'::jsonb;

