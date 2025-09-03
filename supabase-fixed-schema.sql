-- FIXED SUPABASE PRODUCTION BANKING SCHEMA
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)

/* Ensure the uuid-ossp extension is available for UUID generation */
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA extensions;

/* Helper function to generate a unique bank account number */
CREATE OR REPLACE FUNCTION public.generate_account_number()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    acct_num text;
BEGIN
    LOOP
        acct_num := lpad((floor(random() * 1000000000))::text, 10, '0');
        -- Ensure uniqueness
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE account_number = acct_num);
    END LOOP;
    RETURN acct_num;
END;
$$;

/* Create comprehensive banking tables */
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_number TEXT UNIQUE NOT NULL DEFAULT public.generate_account_number(),
    account_type VARCHAR(50) NOT NULL DEFAULT 'checking',
    account_name VARCHAR(255) NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    from_account_id UUID REFERENCES public.bank_accounts(id),
    to_account_id UUID REFERENCES public.bank_accounts(id),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    transaction_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    reference_number VARCHAR(100),
    recipient_name VARCHAR(255),
    recipient_country VARCHAR(100),
    bank_name VARCHAR(255),
    swift_code VARCHAR(20),
    transfer_purpose VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.cards (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.bank_accounts(id),
    card_number VARCHAR(16) UNIQUE NOT NULL,
    card_type VARCHAR(20) NOT NULL DEFAULT 'debit',
    expiry_date DATE NOT NULL,
    cvv VARCHAR(4) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES auth.users(id),
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.beneficiaries (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    bank_name VARCHAR(255),
    swift_code VARCHAR(20),
    country VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.account_statements (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    account_id UUID REFERENCES public.bank_accounts(id),
    statement_date DATE NOT NULL,
    opening_balance DECIMAL(15,2) NOT NULL,
    closing_balance DECIMAL(15,2) NOT NULL,
    total_credits DECIMAL(15,2) DEFAULT 0.00,
    total_debits DECIMAL(15,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

/* Indexes for foreign keys (optimizing joins and RLS checks) */
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account_id ON public.transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account_id ON public.transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON public.cards(account_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON public.beneficiaries(user_id);
CREATE INDEX IF NOT EXISTS idx_account_statements_account_id ON public.account_statements(account_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);

/* Enable RLS on all tables */
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

/* RLS policies – ensure each authenticated user only sees their own data */

-- Bank accounts – users can view, insert, update, delete their own accounts
CREATE POLICY "Bank accounts: select own" ON public.bank_accounts
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Bank accounts: insert own" ON public.bank_accounts
FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Bank accounts: update own" ON public.bank_accounts
FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Bank accounts: delete own" ON public.bank_accounts
FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Transactions – users can view transactions where they are either sender or receiver
CREATE POLICY "Transactions: select own" ON public.transactions
FOR SELECT TO authenticated USING (
    (SELECT auth.uid()) = (
        SELECT user_id FROM public.bank_accounts WHERE id = from_account_id
    ) OR (SELECT auth.uid()) = (
        SELECT user_id FROM public.bank_accounts WHERE id = to_account_id
    )
);

CREATE POLICY "Transactions: insert own" ON public.transactions
FOR INSERT TO authenticated WITH CHECK (
    (SELECT auth.uid()) = (
        SELECT user_id FROM public.bank_accounts WHERE id = from_account_id
    )
);

CREATE POLICY "Transactions: update own" ON public.transactions
FOR UPDATE TO authenticated USING (
    status = 'pending' AND (
        (SELECT auth.uid()) = (
            SELECT user_id FROM public.bank_accounts WHERE id = from_account_id
        )
    )
) WITH CHECK (
    status = 'pending' AND (
        (SELECT auth.uid()) = (
            SELECT user_id FROM public.bank_accounts WHERE id = from_account_id
        )
    )
);

CREATE POLICY "Transactions: delete own" ON public.transactions
FOR DELETE TO authenticated USING (
    status = 'pending' AND (
        (SELECT auth.uid()) = (
            SELECT user_id FROM public.bank_accounts WHERE id = from_account_id
        )
    )
);

-- Cards – users can manage cards linked to their accounts
CREATE POLICY "Cards: select own" ON public.cards
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Cards: insert own" ON public.cards
FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Cards: update own" ON public.cards
FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Cards: delete own" ON public.cards
FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Messages – users can read messages they sent
CREATE POLICY "Messages: select own" ON public.messages
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = sender_id);

CREATE POLICY "Messages: insert own" ON public.messages
FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = sender_id);

-- Beneficiaries – users manage their own beneficiaries
CREATE POLICY "Beneficiaries: select own" ON public.beneficiaries
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Beneficiaries: insert own" ON public.beneficiaries
FOR INSERT TO authenticated WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Beneficiaries: update own" ON public.beneficiaries
FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Beneficiaries: delete own" ON public.beneficiaries
FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Account statements – users can view statements for accounts they own
CREATE POLICY "Account statements: select own" ON public.account_statements
FOR SELECT TO authenticated USING (
    (SELECT auth.uid()) = (
        SELECT user_id FROM public.bank_accounts WHERE id = account_id
    )
);

-- Alerts – users can view and manage their own alerts
CREATE POLICY "Alerts: select own" ON public.alerts
FOR SELECT TO authenticated USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Alerts: update own" ON public.alerts
FOR UPDATE TO authenticated USING ((SELECT auth.uid()) = user_id) WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Alerts: delete own" ON public.alerts
FOR DELETE TO authenticated USING ((SELECT auth.uid()) = user_id);

-- Enable realtime for live banking features
ALTER PUBLICATION supabase_realtime ADD TABLE public.bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;