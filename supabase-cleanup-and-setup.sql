/* -------------------------------------------------------------
   0️⃣  Helper – make sure the required extension exists
   ------------------------------------------------------------- */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

/* -------------------------------------------------------------
   1️⃣  Remove every object that depends on bank_accounts
   ------------------------------------------------------------- */
-- a) Remove the table from the realtime publication (ignore if missing)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.bank_accounts;
EXCEPTION
    WHEN undefined_object THEN NULL;
END;
$$;

-- b) Drop any RLS policies that were created on the old table
DO $$
BEGIN
    DROP POLICY "Users can view own accounts" ON public.bank_accounts;
EXCEPTION
    WHEN undefined_object THEN NULL;
END;
$$;

-- c) Drop foreign‑key constraints that reference bank_accounts
ALTER TABLE public.transactions
    DROP CONSTRAINT IF EXISTS transactions_from_account_id_fkey,
    DROP CONSTRAINT IF EXISTS transactions_to_account_id_fkey;

ALTER TABLE public.cards
    DROP CONSTRAINT IF EXISTS cards_account_id_fkey;

/* -------------------------------------------------------------
   2️⃣  Drop the old table (if it still exists)
   ------------------------------------------------------------- */
DROP TABLE IF EXISTS public.bank_accounts CASCADE;
DROP TABLE IF EXISTS public.account_statements CASCADE;
DROP TABLE IF EXISTS public.cards CASCADE;

/* -------------------------------------------------------------
   3️⃣  Create comprehensive banking schema
   ------------------------------------------------------------- */

-- Bank Users table (links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.bank_users (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Accounts table
CREATE TABLE public.bank_accounts (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        BIGINT   NOT NULL
        REFERENCES public.bank_users(id) ON DELETE CASCADE,
    account_number VARCHAR(50) NOT NULL UNIQUE,
    account_type   VARCHAR(20) NOT NULL,          -- checking, savings, investment
    balance        DECIMAL(15,2) DEFAULT 0.00,
    currency       VARCHAR(3)   DEFAULT 'USD',
    is_active      BOOLEAN      DEFAULT true,
    created_at     TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at     TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transactions table for international banking
CREATE TABLE IF NOT EXISTS public.transactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    from_account_id BIGINT REFERENCES public.bank_accounts(id),
    to_account_id BIGINT REFERENCES public.bank_accounts(id),
    from_account_number VARCHAR(50),
    to_account_number VARCHAR(50),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    transaction_type VARCHAR(20) NOT NULL, -- transfer, deposit, withdrawal
    status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for realtime chat
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    sender_name VARCHAR(100) NOT NULL,
    sender_role VARCHAR(20) NOT NULL, -- admin, customer
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    conversation_id UUID,
    reply_to UUID REFERENCES public.messages(id),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table for realtime notifications
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- success, warning, error, info
    category VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'normal',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    action_url TEXT,
    action_label VARCHAR(100),
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

/* -------------------------------------------------------------
   4️⃣  Insert Wei Liu's banking data
   ------------------------------------------------------------- */
INSERT INTO public.bank_users (
    supabase_user_id, username, full_name, email, phone, 
    account_number, account_id, profession, date_of_birth,
    address, city, state, country, postal_code, nationality,
    annual_income, id_type, id_number, transfer_pin, balance
) VALUES (
    '0633f82f-5306-41e9-9ed4-11ee555e5087',
    'vaa33053',
    'Wei Liu',
    'vaa33053@gmail.com',
    '+1 234 567 8900',
    '4789-5532-1098-7654',
    'WB-2025-8912',
    'Software Engineer',
    '1990-05-15',
    '123 Tech Street',
    'San Francisco',
    'California',
    'United States',
    '94102',
    'American',
    '$75,000-$100,000',
    'Passport',
    'P123456789',
    '0192',
    15750.50
) ON CONFLICT (email) DO UPDATE SET
    supabase_user_id = EXCLUDED.supabase_user_id,
    balance = EXCLUDED.balance,
    updated_at = NOW();

-- Insert bank accounts for Wei Liu
INSERT INTO public.bank_accounts (user_id, account_number, account_type, balance, currency) 
SELECT 
    bu.id,
    account_data.account_number,
    account_data.account_type,
    account_data.balance,
    account_data.currency
FROM public.bank_users bu
CROSS JOIN (
    VALUES 
        ('4789-5532-1098-7654', 'checking', 15750.50, 'USD'),
        ('4789-5532-1098-7655', 'savings', 25000.75, 'USD'),
        ('4789-5532-1098-7656', 'investment', 45000.00, 'USD')
) AS account_data(account_number, account_type, balance, currency)
WHERE bu.email = 'vaa33053@gmail.com'
ON CONFLICT (account_number) DO UPDATE SET
    balance = EXCLUDED.balance,
    updated_at = NOW();

/* -------------------------------------------------------------
   5️⃣  Enable Row Level Security (RLS) for data protection
   ------------------------------------------------------------- */
ALTER TABLE public.bank_users      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts          ENABLE ROW LEVEL SECURITY;

/* -------------------------------------------------------------
   6️⃣  RLS Policies for secure access
   ------------------------------------------------------------- */
-- Users can view own data
DO $$
BEGIN
    DROP POLICY "Users can view own data" ON public.bank_users;
EXCEPTION
    WHEN undefined_object THEN NULL;
END;
$$;

CREATE POLICY "Users can view own data"
    ON public.bank_users
    FOR SELECT TO authenticated
    USING (supabase_user_id = auth.uid());

-- Users can view own accounts
DO $$
BEGIN
    DROP POLICY "Account owners can view" ON public.bank_accounts;
EXCEPTION
    WHEN undefined_object THEN NULL;
END;
$$;

CREATE POLICY "Account owners can view"
    ON public.bank_accounts
    FOR SELECT TO authenticated
    USING (user_id = (SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()));

-- Users can view own transactions
DO $$
BEGIN
    DROP POLICY "Users can view own transactions" ON public.transactions;
EXCEPTION
    WHEN undefined_object THEN NULL;
END;
$$;

CREATE POLICY "Users can view own transactions"
    ON public.transactions
    FOR SELECT TO authenticated
    USING (
        from_account_id IN (SELECT id FROM public.bank_accounts WHERE user_id = (SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()))
        OR to_account_id IN (SELECT id FROM public.bank_accounts WHERE user_id = (SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()))
    );

-- Service role policies (admin access)
CREATE POLICY "Service role can manage all data" ON public.bank_users
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all accounts" ON public.bank_accounts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all transactions" ON public.transactions
    FOR ALL USING (auth.role() = 'service_role');

/* -------------------------------------------------------------
   7️⃣  Enable realtime for admin synchronization
   ------------------------------------------------------------- */
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_users;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

/* -------------------------------------------------------------
   8️⃣  Create indexes for performance
   ------------------------------------------------------------- */
CREATE INDEX IF NOT EXISTS idx_bank_users_supabase_id ON public.bank_users(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_bank_users_email ON public.bank_users(email);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_accounts ON public.transactions(from_account_id, to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.alerts(user_id);

/* -------------------------------------------------------------
   9️⃣  Grant necessary permissions
   ------------------------------------------------------------- */
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;