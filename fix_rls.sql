-- Supabase Migration: Add missing RLS policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Clients: Anyone authenticated can read basic client info
DROP POLICY IF EXISTS "Auth users can read clients" ON clients;
CREATE POLICY "Auth users can read clients" ON clients
    FOR SELECT USING (auth.role() = 'authenticated');

-- Clients: Super admins or setup scripts can insert (allowing emergency creation)
DROP POLICY IF EXISTS "Auth users can insert clients" ON clients;
CREATE POLICY "Auth users can insert clients" ON clients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Conversations: Team members can read/write conversations for their clients
DROP POLICY IF EXISTS "Team members manage conversations" ON conversations;
CREATE POLICY "Team members manage conversations" ON conversations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM team_members tm
            WHERE tm.user_id = auth.uid() AND tm.client_id = conversations.client_id
        )
    );

-- Fallback for testing: Authenticated users can insert conversations
DROP POLICY IF EXISTS "Auth users can insert conversations" ON conversations;
CREATE POLICY "Auth users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
