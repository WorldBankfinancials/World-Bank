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
    transfer_pin VARCHAR(10) NOT NULL DEFAULT '1234',
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

-- Cards table
CREATE TABLE public.cards (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES public.bank_users(id) ON DELETE CASCADE,
    card_number VARCHAR(20) NOT NULL,
    card_name VARCHAR(100) NOT NULL,
    card_type VARCHAR(20) NOT NULL CHECK (card_type IN ('Visa', 'Mastercard', 'Platinum', 'Gold', 'Business')),
    balance DECIMAL(15,2) DEFAULT 0.00,
    credit_limit DECIMAL(15,2) DEFAULT 0.00,
    expiry_date VARCHAR(7) NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    daily_limit DECIMAL(15,2) DEFAULT 5000.00,
    contactless_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ================================================================
-- STEP 3: AUTOMATIC USER CREATION TRIGGER (CRITICAL FIX)
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_account_number VARCHAR(50);
    new_account_id VARCHAR(50);
BEGIN
    -- Generate unique account identifiers
    new_account_number := '4789-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || '-' || 
                         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0') || '-' || 
                         LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    new_account_id := 'WB-' || EXTRACT(YEAR FROM NOW()) || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Create bank user automatically
    INSERT INTO public.bank_users (
        supabase_user_id,
        username,
        full_name,
        email,
        phone,
        account_number,
        account_id,
        transfer_pin,
        role,
        is_verified,
        is_active,
        balance
    ) VALUES (
        NEW.id,
        SPLIT_PART(NEW.email, '@', 1),
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'Customer'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
        new_account_number,
        new_account_id,
        '1234', -- Default PIN
        'customer',
        true,
        true,
        0.00
    );

    -- Create default checking account
    INSERT INTO public.bank_accounts (
        user_id,
        account_number,
        account_type,
        balance,
        currency
    ) VALUES (
        (SELECT id FROM public.bank_users WHERE supabase_user_id = NEW.id),
        new_account_number,
        'checking',
        0.00,
        'USD'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- STEP 4: Create indexes for optimal performance
-- ================================================================

CREATE INDEX idx_bank_users_supabase_id ON public.bank_users(supabase_user_id);
CREATE INDEX idx_bank_users_email ON public.bank_users(email);
CREATE INDEX idx_bank_users_username ON public.bank_users(username);
CREATE INDEX idx_bank_users_account_number ON public.bank_users(account_number);
CREATE INDEX idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_account_number ON public.bank_accounts(account_number);
CREATE INDEX idx_transactions_from_account ON public.transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON public.transactions(to_account_id);
CREATE INDEX idx_transactions_status ON public.transactions(status);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX idx_alerts_user ON public.alerts(user_id);
CREATE INDEX idx_cards_user_id ON public.cards(user_id);

-- ================================================================
-- STEP 5: Enable Row Level Security (RLS)
-- ================================================================

ALTER TABLE public.bank_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can view own profile" ON public.bank_users
    FOR SELECT TO authenticated
    USING (supabase_user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.bank_users
    FOR UPDATE TO authenticated
    USING (supabase_user_id = auth.uid());

-- Account policies
CREATE POLICY "Users can view own accounts" ON public.bank_accounts
    FOR SELECT TO authenticated
    USING (user_id = (SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()));

-- Transaction policies
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT TO authenticated
    USING (
        from_account_id IN (
            SELECT ba.id FROM public.bank_accounts ba
            JOIN public.bank_users bu ON ba.user_id = bu.id
            WHERE bu.supabase_user_id = auth.uid()
        )
    );

-- Service role full access
CREATE POLICY "Service role full access users" ON public.bank_users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access accounts" ON public.bank_accounts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access transactions" ON public.transactions FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role full access cards" ON public.cards FOR ALL USING (auth.role() = 'service_role');

-- ================================================================
-- STEP 6: Enable realtime
-- ================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;