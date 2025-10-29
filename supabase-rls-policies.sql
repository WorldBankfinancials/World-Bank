-- ================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================
-- Run this in your Supabase SQL Editor to enable RLS on all tables
-- This ensures complete data isolation between users
-- ================================================================

-- STEP 1: Enable RLS on all banking tables
-- ================================================================
ALTER TABLE public.bank_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_rates ENABLE ROW LEVEL SECURITY;

-- STEP 2: Drop existing policies (cleanup)
-- ================================================================
DROP POLICY IF EXISTS "Service role full access to users" ON public.bank_users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.bank_users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.bank_users;

DROP POLICY IF EXISTS "Service role full access to accounts" ON public.bank_accounts;
DROP POLICY IF EXISTS "Users can view own accounts" ON public.bank_accounts;

DROP POLICY IF EXISTS "Service role full access to transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Service role full access to cards" ON public.cards;
DROP POLICY IF EXISTS "Users can view own cards" ON public.cards;

DROP POLICY IF EXISTS "Service role full access to investments" ON public.investments;
DROP POLICY IF EXISTS "Users can view own investments" ON public.investments;

DROP POLICY IF EXISTS "Service role full access to messages" ON public.messages;
DROP POLICY IF EXISTS "Users can view own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can create messages" ON public.messages;

DROP POLICY IF EXISTS "Service role full access to alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON public.alerts;

DROP POLICY IF EXISTS "Service role full access to support_tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can update own tickets" ON public.support_tickets;

DROP POLICY IF EXISTS "Service role full access to documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can upload documents" ON public.documents;

DROP POLICY IF EXISTS "Service role full access to admin_actions" ON public.admin_actions;

DROP POLICY IF EXISTS "Service role full access to branches" ON public.branches;
DROP POLICY IF EXISTS "Public can view branches" ON public.branches;

DROP POLICY IF EXISTS "Service role full access to atms" ON public.atms;
DROP POLICY IF EXISTS "Public can view atms" ON public.atms;

DROP POLICY IF EXISTS "Service role full access to exchange_rates" ON public.exchange_rates;
DROP POLICY IF EXISTS "Public can view exchange_rates" ON public.exchange_rates;

DROP POLICY IF EXISTS "Service role full access to market_rates" ON public.market_rates;
DROP POLICY IF EXISTS "Public can view market_rates" ON public.market_rates;

DROP POLICY IF EXISTS "Service role full access to statements" ON public.statements;
DROP POLICY IF EXISTS "Users can view own statements" ON public.statements;

-- STEP 3: Create comprehensive RLS policies
-- ================================================================

-- 1. BANK_USERS POLICIES
-- Backend (service_role) has full access for admin operations
-- Users can only view/update their own profile
-- ================================================================
CREATE POLICY "Service role full access to users"
ON public.bank_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own profile"
ON public.bank_users
FOR SELECT
TO authenticated
USING (supabase_user_id = auth.uid()::text);

CREATE POLICY "Users can update own profile"
ON public.bank_users
FOR UPDATE
TO authenticated
USING (supabase_user_id = auth.uid()::text)
WITH CHECK (supabase_user_id = auth.uid()::text);

-- 2. BANK_ACCOUNTS POLICIES
-- Backend manages accounts, users can only view their own
-- ================================================================
CREATE POLICY "Service role full access to accounts"
ON public.bank_accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own accounts"
ON public.bank_accounts
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

-- 3. TRANSACTIONS POLICIES
-- Users can view transactions where they are sender or receiver
-- ================================================================
CREATE POLICY "Service role full access to transactions"
ON public.transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own transactions"
ON public.transactions
FOR SELECT
TO authenticated
USING (
  from_account_id IN (
    SELECT ba.id FROM public.bank_accounts ba
    JOIN public.bank_users bu ON ba.user_id = bu.id
    WHERE bu.supabase_user_id = auth.uid()::text
  )
  OR
  to_account_id IN (
    SELECT ba.id FROM public.bank_accounts ba
    JOIN public.bank_users bu ON ba.user_id = bu.id
    WHERE bu.supabase_user_id = auth.uid()::text
  )
);

-- 4. CARDS POLICIES
-- Users can only view cards linked to their accounts
-- ================================================================
CREATE POLICY "Service role full access to cards"
ON public.cards
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own cards"
ON public.cards
FOR SELECT
TO authenticated
USING (
  account_id IN (
    SELECT ba.id FROM public.bank_accounts ba
    JOIN public.bank_users bu ON ba.user_id = bu.id
    WHERE bu.supabase_user_id = auth.uid()::text
  )
);

-- 5. INVESTMENTS POLICIES
-- Users can only view their own investments
-- ================================================================
CREATE POLICY "Service role full access to investments"
ON public.investments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own investments"
ON public.investments
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

-- 6. MESSAGES POLICIES
-- Users can view messages they sent or received, and create new messages
-- ================================================================
CREATE POLICY "Service role full access to messages"
ON public.messages
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  from_user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
  OR
  to_user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can create messages"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  from_user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

-- 7. ALERTS POLICIES
-- Users can view and update their own alerts
-- ================================================================
CREATE POLICY "Service role full access to alerts"
ON public.alerts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own alerts"
ON public.alerts
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can update own alerts"
ON public.alerts
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

-- 8. SUPPORT_TICKETS POLICIES
-- Users can view, create, and update their own support tickets
-- ================================================================
CREATE POLICY "Service role full access to support_tickets"
ON public.support_tickets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can create tickets"
ON public.support_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can update own tickets"
ON public.support_tickets
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

-- 9. DOCUMENTS POLICIES
-- Users can view and upload their own verification documents
-- ================================================================
CREATE POLICY "Service role full access to documents"
ON public.documents
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

CREATE POLICY "Users can upload documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

-- 10. ADMIN_ACTIONS POLICIES
-- Only backend can manage admin actions (audit trail)
-- ================================================================
CREATE POLICY "Service role full access to admin_actions"
ON public.admin_actions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 11. PUBLIC READ TABLES (branches, atms, exchange_rates, market_rates)
-- All authenticated users can read, only backend can manage
-- ================================================================

-- BRANCHES
CREATE POLICY "Service role full access to branches"
ON public.branches
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view branches"
ON public.branches
FOR SELECT
TO authenticated
USING (true);

-- ATMS
CREATE POLICY "Service role full access to atms"
ON public.atms
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view atms"
ON public.atms
FOR SELECT
TO authenticated
USING (true);

-- EXCHANGE_RATES
CREATE POLICY "Service role full access to exchange_rates"
ON public.exchange_rates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view exchange_rates"
ON public.exchange_rates
FOR SELECT
TO authenticated
USING (true);

-- MARKET_RATES
CREATE POLICY "Service role full access to market_rates"
ON public.market_rates
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view market_rates"
ON public.market_rates
FOR SELECT
TO authenticated
USING (true);

-- 12. STATEMENTS POLICIES
-- Users can only view their own bank statements
-- ================================================================
CREATE POLICY "Service role full access to statements"
ON public.statements
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Users can view own statements"
ON public.statements
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.bank_users WHERE supabase_user_id = auth.uid()::text
  )
);

-- ================================================================
-- RLS POLICIES COMPLETE!
-- ================================================================
-- These policies ensure:
-- 1. Complete data isolation between users
-- 2. Users can only access their own data
-- 3. Backend (service_role) can manage all data for admin operations
-- 4. Public data (branches, ATMs, rates) is readable by all authenticated users
-- ================================================================
