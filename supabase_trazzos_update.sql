-- Update products table to include stock
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock INTEGER DEFAULT 0;

-- Create remarketing_leads table
CREATE TABLE IF NOT EXISTS remarketing_leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    last_purchase_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    status TEXT DEFAULT 'pending', -- pending, messaged, interested, converted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for remarketing_leads
ALTER TABLE remarketing_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see remarketing leads of their company" ON remarketing_leads
    FOR ALL USING (
        client_id IN (
            SELECT client_id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'escalation',
    read BOOLEAN DEFAULT FALSE,
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see notifications of their company" ON notifications
    FOR ALL USING (
        client_id IN (
            SELECT client_id FROM team_members WHERE user_id = auth.uid()
        )
    );

-- Add assigned_to to conversations if not exists
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id);
