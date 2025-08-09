-- Real-time hybrid setup for World Bank application
-- This keeps your mock UI but adds real Supabase backend for live features

-- Create messages table for real-time chat
CREATE TABLE IF NOT EXISTS messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    sender_id uuid REFERENCES auth.users(id),
    recipient_id uuid REFERENCES auth.users(id), -- For admin/customer routing
    content text NOT NULL,
    sender_role text DEFAULT 'customer' CHECK (sender_role IN ('customer', 'admin')),
    sender_name text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Create alerts table for real-time notifications
CREATE TABLE IF NOT EXISTS alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error')),
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Create support_tickets table for real-time customer service
CREATE TABLE IF NOT EXISTS support_tickets (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create transactions table for real-time transaction updates (hybrid with your mock data)
CREATE TABLE IF NOT EXISTS live_transactions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id),
    amount decimal(15,2) NOT NULL,
    type text NOT NULL CHECK (type IN ('credit', 'debit', 'transfer', 'admin-topup')),
    description text NOT NULL,
    recipient_account text,
    status text DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security (RLS) for all tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for messages (customers see their own, admins see all)
CREATE POLICY "Users can view their own messages" ON messages
    FOR SELECT USING (
        sender_id = auth.uid() OR 
        recipient_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can insert their own messages" ON messages
    FOR INSERT WITH CHECK (sender_id = auth.uid());

-- RLS policies for alerts (users see their own alerts)
CREATE POLICY "Users can view their own alerts" ON alerts
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert alerts" ON alerts
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- RLS policies for support tickets
CREATE POLICY "Users can view their own tickets" ON support_tickets
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Users can create their own tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS policies for live transactions
CREATE POLICY "Users can view their own transactions" ON live_transactions
    FOR SELECT USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can insert transactions" ON live_transactions
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_live_transactions_user_id ON live_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_live_transactions_created_at ON live_transactions(created_at DESC);

-- Insert sample data to test real-time functionality
INSERT INTO messages (sender_id, content, sender_role, sender_name) VALUES
(
    (SELECT id FROM auth.users WHERE email = 'bankmanagerworld5@gmail.com' LIMIT 1),
    'Welcome to World Bank Customer Service. How may I assist you today?',
    'admin',
    'World Bank Support'
);

INSERT INTO alerts (user_id, title, message, type) VALUES
(
    (SELECT id FROM auth.users WHERE email = 'liu.wei@oilrig.com' LIMIT 1),
    'Account Security Update',
    'Your account security settings have been enhanced with additional fraud protection.',
    'success'
);