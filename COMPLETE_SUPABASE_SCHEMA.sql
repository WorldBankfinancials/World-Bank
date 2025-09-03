-- ================================================================
-- WORLD BANK COMPLETE SUPABASE DATABASE SCHEMA
-- Run this entire script in your Supabase SQL Editor
-- ================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- STEP 1: Clean up existing conflicting objects
-- ================================================================

-- Drop existing tables in correct order (foreign keys first)
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.account_statements CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;
DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.alerts CASCADE;
DROP TABLE IF EXISTS public.beneficiaries CASCADE;
DROP TABLE IF EXISTS public.bank_users CASCADE;

-- Drop any existing policies
DO $$
DECLARE
    pol_name text;
BEGIN
    FOR pol_name IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename IN ('bank_users', 'bank_accounts', 'transactions', 'messages', 'alerts')
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol_name || '" ON public.' || 
                (SELECT tablename FROM pg_policies WHERE policyname = pol_name AND schemaname = 'public' LIMIT 1);
    END LOOP;
END;
$$;

-- ================================================================
-- STEP 2: Create all banking tables with proper structure
-- ================================================================

-- Bank Users table (main user profiles linked to Supabase auth)
CREATE TABLE public.bank_users (
    id BIGSERIAL PRIMARY KEY,
    supabase_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL DEFAULT 'supabase_auth',
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_id VARCHAR(50) UNIQUE NOT NULL,
    profession VARCHAR(100),
    date_of_birth DATE,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    country VARCHAR(50),
    postal_code VARCHAR(20),
    nationality VARCHAR(50),
    annual_income VARCHAR(50),
    id_type VARCHAR(50),
    id_number VARCHAR(50),
    transfer_pin VARCHAR(10) NOT NULL,
    role VARCHAR(20) DEFAULT 'customer',
    is_verified BOOLEAN DEFAULT true,
    is_online BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    avatar_url TEXT,
    balance DECIMAL(15,2) DEFAULT 0.00,
    last_login TIMESTAMP WITH TIME ZONE,
    created_by_admin BOOLEAN DEFAULT false,
    modified_by_admin BOOLEAN DEFAULT false,
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Accounts table (multiple accounts per user)
CREATE TABLE public.bank_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_type VARCHAR(20) NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'business')),
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    interest_rate DECIMAL(5,2) DEFAULT 0.00,
    minimum_balance DECIMAL(15,2) DEFAULT 0.00,
    overdraft_limit DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table (all banking transactions)
CREATE TABLE public.transactions (
    id BIGSERIAL PRIMARY KEY,
    transaction_id UUID DEFAULT uuid_generate_v4() UNIQUE,
    from_account_id BIGINT REFERENCES public.bank_accounts(id),
    to_account_id BIGINT REFERENCES public.bank_accounts(id),
    from_account_number VARCHAR(50),
    to_account_number VARCHAR(50),
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) DEFAULT 'USD',
    exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
    fee DECIMAL(15,2) DEFAULT 0.00,
    description TEXT,
    reference_number VARCHAR(100),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('transfer', 'deposit', 'withdrawal', 'payment', 'fee')),
    transaction_category VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'requires_approval')),
    failure_reason TEXT,
    admin_approved_by BIGINT REFERENCES public.bank_users(id),
    admin_notes TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table (customer support chat)
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name VARCHAR(100) NOT NULL,
    sender_role VARCHAR(20) NOT NULL CHECK (sender_role IN ('admin', 'customer', 'system')),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    conversation_id UUID,
    reply_to UUID REFERENCES public.messages(id),
    metadata JSONB,
    attachments JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table (notifications and system alerts)
CREATE TABLE public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('success', 'warning', 'error', 'info', 'security')),
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    action_label VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Beneficiaries table (saved transfer recipients)
CREATE TABLE public.beneficiaries (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
    beneficiary_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(100),
    bank_code VARCHAR(20),
    swift_code VARCHAR(20),
    iban VARCHAR(50),
    country VARCHAR(50),
    currency VARCHAR(3) DEFAULT 'USD',
    is_favorite BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account Statements table (monthly statements)
CREATE TABLE public.account_statements (
    id BIGSERIAL PRIMARY KEY,
    account_id BIGINT NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    statement_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    total_credits DECIMAL(15,2) DEFAULT 0.00,
    total_debits DECIMAL(15,2) DEFAULT 0.00,
    statement_period_start DATE NOT NULL,
    statement_period_end DATE NOT NULL,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- STEP 3: Insert Wei Liu's banking data
-- ================================================================

INSERT INTO public.bank_users (
    supabase_user_id, 
    username, 
    full_name, 
    email, 
    phone, 
    account_number, 
    account_id, 
    profession, 
    date_of_birth,
    address, 
    city, 
    state, 
    country, 
    postal_code, 
    nationality,
    annual_income, 
    id_type, 
    id_number, 
    transfer_pin, 
    balance,
    last_login
) VALUES (
    '0633f82f-5306-41e9-9ed4-11ee555e5087',
    'vaa33053',
    'Wei Liu',
    'vaa33053@gmail.com',
    '+1 (234) 567-8900',
    '4789-5532-1098-7654',
    'WB-2025-8912',
    'Software Engineer',
    '1990-05-15',
    '123 Tech Street, Suite 100',
    'San Francisco',
    'California',
    'United States',
    '94102',
    'American',
    '$75,000-$100,000',
    'Passport',
    'P123456789',
    '0192',
    15750.50,
    NOW()
);

-- Insert multiple bank accounts for Wei Liu
INSERT INTO public.bank_accounts (user_id, account_number, account_type, balance, currency, interest_rate)
SELECT 
    bu.id,
    account_data.account_number,
    account_data.account_type,
    account_data.balance,
    account_data.currency,
    account_data.interest_rate
FROM public.bank_users bu
CROSS JOIN (
    VALUES 
        ('4789-5532-1098-7654', 'checking', 15750.50, 'USD', 0.01),
        ('4789-5532-1098-7655', 'savings', 25000.75, 'USD', 2.50),
        ('4789-5532-1098-7656', 'investment', 45000.00, 'USD', 4.25),
        ('4789-5532-1098-7657', 'business', 12500.25, 'USD', 1.75)
) AS account_data(account_number, account_type, balance, currency, interest_rate)
WHERE bu.email = 'vaa33053@gmail.com';

-- Insert sample transaction history
INSERT INTO public.transactions (
    from_account_id, 
    to_account_id, 
    from_account_number, 
    to_account_number, 
    amount, 
    currency, 
    description, 
    transaction_type, 
    status, 
    processed_at,
    created_at
)
SELECT 
    ba1.id,
    ba2.id,
    '4789-5532-1098-7654',
    '4789-5532-1098-7655',
    transaction_data.amount,
    'USD',
    transaction_data.description,
    'transfer',
    'completed',
    NOW() - INTERVAL '1 day' * transaction_data.days_ago,
    NOW() - INTERVAL '1 day' * transaction_data.days_ago
FROM public.bank_accounts ba1, public.bank_accounts ba2
CROSS JOIN (
    VALUES 
        (1000.00, 'Monthly savings transfer', 1),
        (2500.00, 'Investment contribution', 3),
        (500.00, 'Emergency fund transfer', 7),
        (1200.00, 'Quarterly investment', 14)
) AS transaction_data(amount, description, days_ago)
WHERE ba1.account_number = '4789-5532-1098-7654' 
AND ba2.account_number = '4789-5532-1098-7655'
LIMIT 4;

-- Insert sample beneficiaries
INSERT INTO public.beneficiaries (user_id, beneficiary_name, account_number, bank_name, country, is_favorite)
SELECT 
    bu.id,
    beneficiary_data.name,
    beneficiary_data.account_number,
    beneficiary_data.bank_name,
    beneficiary_data.country,
    beneficiary_data.is_favorite
FROM public.bank_users bu
CROSS JOIN (
    VALUES 
        ('John Smith', '1234-5678-9012-3456', 'Chase Bank', 'United States', true),
        ('Maria Garcia', '9876-5432-1098-7654', 'Bank of America', 'United States', false),
        ('Li Wei', '5555-4444-3333-2222', 'ICBC', 'China', true),
        ('Sarah Johnson', '7777-8888-9999-0000', 'Wells Fargo', 'United States', false)
) AS beneficiary_data(name, account_number, bank_name, country, is_favorite)
WHERE bu.email = 'vaa33053@gmail.com';

-- ================================================================
-- STEP 4: Create indexes for optimal performance
-- ================================================================

-- User lookup indexes
CREATE INDEX idx_bank_users_supabase_id ON public.bank_users(supabase_user_id);
CREATE INDEX idx_bank_users_email ON public.bank_users(email);
CREATE INDEX idx_bank_users_username ON public.bank_users(username);
CREATE INDEX idx_bank_users_account_number ON public.bank_users(account_number);

-- Account indexes
CREATE INDEX idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_account_number ON public.bank_accounts(account_number);
CREATE INDEX idx_bank_accounts_type ON public.bank_accounts(account_type);
CREATE INDEX idx_bank_accounts_active ON public.bank_accounts(is_active);

-- Transaction indexes for fast queries
CREATE INDEX idx_transactions_from_account ON public.transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON public.transactions(to_account_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX idx_transactions_date ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_reference ON public.transactions(reference_number);

-- Communication indexes
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(created_at DESC);

-- Alert indexes
CREATE INDEX idx_alerts_user ON public.alerts(user_id);
CREATE INDEX idx_alerts_type ON public.alerts(type);
CREATE INDEX idx_alerts_read ON public.alerts(is_read);
CREATE INDEX idx_alerts_created ON public.alerts(created_at DESC);

-- Beneficiary indexes
CREATE INDEX idx_beneficiaries_user ON public.beneficiaries(user_id);
CREATE INDEX idx_beneficiaries_favorite ON public.beneficiaries(is_favorite);

-- ================================================================
-- STEP 5: Enable Row Level Security (RLS) for data protection
-- ================================================================

ALTER TABLE public.bank_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_statements ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- STEP 6: Create comprehensive RLS policies
-- ================================================================

-- Bank Users policies
CREATE POLICY "Users can view own profile" ON public.bank_users
    FOR SELECT TO authenticated
    USING (supabase_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.bank_users
    FOR UPDATE TO authenticated
    USING (supabase_user_id = auth.uid());

-- Bank Accounts policies
CREATE POLICY "Users can view own accounts" ON public.bank_accounts
    FOR SELECT TO authenticated
    USING (user_id = (SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()));

CREATE POLICY "Users can update own accounts" ON public.bank_accounts
    FOR UPDATE TO authenticated
    USING (user_id = (SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()));

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT TO authenticated
    USING (
        from_account_id IN (
            SELECT ba.id FROM public.bank_accounts ba
            JOIN public.bank_users bu ON ba.user_id = bu.id
            WHERE bu.supabase_user_id = auth.uid()
        )
        OR to_account_id IN (
            SELECT ba.id FROM public.bank_accounts ba
            JOIN public.bank_users bu ON ba.user_id = bu.id
            WHERE bu.supabase_user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create own transactions" ON public.transactions
    FOR INSERT TO authenticated
    WITH CHECK (
        from_account_id IN (
            SELECT ba.id FROM public.bank_accounts ba
            JOIN public.bank_users bu ON ba.user_id = bu.id
            WHERE bu.supabase_user_id = auth.uid()
        )
    );

-- Messages policies
CREATE POLICY "Users can view own messages" ON public.messages
    FOR SELECT TO authenticated
    USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT TO authenticated
    WITH CHECK (sender_id = auth.uid());

-- Alerts policies
CREATE POLICY "Users can view own alerts" ON public.alerts
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can update own alerts" ON public.alerts
    FOR UPDATE TO authenticated
    USING (user_id = auth.uid());

-- Beneficiaries policies
CREATE POLICY "Users can manage own beneficiaries" ON public.beneficiaries
    FOR ALL TO authenticated
    USING (user_id = (SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()));

-- Account Statements policies
CREATE POLICY "Users can view own statements" ON public.account_statements
    FOR SELECT TO authenticated
    USING (
        account_id IN (
            SELECT ba.id FROM public.bank_accounts ba
            JOIN public.bank_users bu ON ba.user_id = bu.id
            WHERE bu.supabase_user_id = auth.uid()
        )
    );

-- ================================================================
-- STEP 7: Admin/Service Role policies (full access)
-- ================================================================

CREATE POLICY "Service role full access users" ON public.bank_users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access accounts" ON public.bank_accounts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access messages" ON public.messages FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access alerts" ON public.alerts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access beneficiaries" ON public.beneficiaries FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access statements" ON public.account_statements FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- STEP 8: Enable realtime subscriptions for live updates
-- ================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.beneficiaries;

-- ================================================================
-- STEP 9: Grant proper permissions
-- ================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant specific permissions for anon users (if needed)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.bank_users TO anon;

-- ================================================================
-- STEP 10: Create database functions for common operations
-- ================================================================

-- Function to get user's total balance across all accounts
CREATE OR REPLACE FUNCTION get_user_total_balance(user_uuid UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
    total_balance DECIMAL(15,2) := 0;
BEGIN
    SELECT COALESCE(SUM(ba.balance), 0) INTO total_balance
    FROM public.bank_accounts ba
    JOIN public.bank_users bu ON ba.user_id = bu.id
    WHERE bu.supabase_user_id = user_uuid AND ba.is_active = true;
    
    RETURN total_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new transaction
CREATE OR REPLACE FUNCTION create_transaction(
    from_account_number VARCHAR(50),
    to_account_number VARCHAR(50),
    transfer_amount DECIMAL(15,2),
    transfer_description TEXT,
    user_uuid UUID
)
RETURNS JSONB AS $$
DECLARE
    from_account_id BIGINT;
    to_account_id BIGINT;
    transaction_result JSONB;
    new_transaction_id BIGINT;
BEGIN
    -- Get from account ID
    SELECT ba.id INTO from_account_id
    FROM public.bank_accounts ba
    JOIN public.bank_users bu ON ba.user_id = bu.id
    WHERE ba.account_number = from_account_number 
    AND bu.supabase_user_id = user_uuid;
    
    -- Get to account ID
    SELECT ba.id INTO to_account_id
    FROM public.bank_accounts ba
    WHERE ba.account_number = to_account_number;
    
    IF from_account_id IS NULL THEN
        RETURN '{"success": false, "error": "From account not found or not owned by user"}'::JSONB;
    END IF;
    
    IF to_account_id IS NULL THEN
        RETURN '{"success": false, "error": "To account not found"}'::JSONB;
    END IF;
    
    -- Create the transaction
    INSERT INTO public.transactions (
        from_account_id,
        to_account_id,
        from_account_number,
        to_account_number,
        amount,
        description,
        transaction_type,
        status
    ) VALUES (
        from_account_id,
        to_account_id,
        from_account_number,
        to_account_number,
        transfer_amount,
        transfer_description,
        'transfer',
        'pending'
    ) RETURNING id INTO new_transaction_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', new_transaction_id,
        'status', 'pending',
        'message', 'Transaction created successfully'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================================
-- VERIFICATION QUERY - Run this after setup to confirm everything works
-- ================================================================

-- Uncomment the lines below to verify your setup:
/*
SELECT 'Database Setup Complete!' as status;
SELECT 'Users created: ' || COUNT(*) as user_count FROM public.bank_users;
SELECT 'Accounts created: ' || COUNT(*) as account_count FROM public.bank_accounts;
SELECT 'Total balance: $' || SUM(balance) as total_balance FROM public.bank_accounts;
SELECT 'Wei Liu total balance: $' || get_user_total_balance('0633f82f-5306-41e9-9ed4-11ee555e5087') as wei_balance;
*/