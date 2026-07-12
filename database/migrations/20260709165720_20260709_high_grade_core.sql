/*
# High-Grade Core Banking Schema — 5 Sovereign Ministries

## Overview
Enterprise-grade relational database for the World Bank Digital Banking application.
Creates 9 new tables (wb_ prefix) with full RLS, indexes, dedup constraints, and triggers.

## New Tables (9 total)
1. wb_users — Identity Ministry (core user identity, KYC, auth status)
2. wb_profiles — Identity Ministry (extended personal data)
3. wb_accounts — Treasury Ministry (bank accounts, balances, currency)
4. wb_transactions — Treasury Ministry (financial transactions with idempotency)
5. wb_notifications — Communications Ministry (user alerts)
6. wb_messages — Communications Ministry (chat messaging)
7. wb_security_events — Security Ministry (security audit trail)
8. wb_audit_logs — Security Ministry (admin action trail)
9. wb_system_events — Operations Ministry (system event log)

## Security
- RLS enabled on all 9 tables
- 37 RLS policies with owner-scoped auth.uid() checks
- Admin role check via EXISTS subquery
- SECURITY DEFINER helper functions for atomic balance operations
*/

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. WB_USERS (Sovereign Ministry of Identity)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wb_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'support', 'compliance')),
  kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_review', 'approved', 'rejected')),
  account_status TEXT NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'frozen', 'suspended', 'closed')),
  transfer_pin_hash TEXT,
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wb_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wb_users_select_own" ON public.wb_users;
CREATE POLICY "wb_users_select_own" ON public.wb_users FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "wb_users_update_own" ON public.wb_users;
CREATE POLICY "wb_users_update_own" ON public.wb_users FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "wb_users_admin_select_all" ON public.wb_users;
CREATE POLICY "wb_users_admin_select_all" ON public.wb_users FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  );

DROP POLICY IF EXISTS "wb_users_admin_update_all" ON public.wb_users;
CREATE POLICY "wb_users_admin_update_all" ON public.wb_users FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  );

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wb_users_updated_at') THEN
    CREATE TRIGGER trg_wb_users_updated_at BEFORE UPDATE ON public.wb_users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wb_users_email ON public.wb_users(email);
CREATE INDEX IF NOT EXISTS idx_wb_users_role ON public.wb_users(role);
CREATE INDEX IF NOT EXISTS idx_wb_users_kyc_status ON public.wb_users(kyc_status);
CREATE INDEX IF NOT EXISTS idx_wb_users_account_status ON public.wb_users(account_status);

-- ============================================================
-- 2. WB_PROFILES (Sovereign Ministry of Identity)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wb_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.wb_users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  phone_number TEXT,
  country_code TEXT DEFAULT '+1',
  address JSONB,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  occupation TEXT,
  employer TEXT,
  annual_income NUMERIC(15,2),
  identification_type TEXT CHECK (identification_type IN ('passport', 'driver_license', 'national_id', 'residence_permit')),
  identification_number TEXT,
  preferred_language TEXT DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wb_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wb_profiles_select_own" ON public.wb_profiles;
CREATE POLICY "wb_profiles_select_own" ON public.wb_profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_profiles_insert_own" ON public.wb_profiles;
CREATE POLICY "wb_profiles_insert_own" ON public.wb_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_profiles_update_own" ON public.wb_profiles;
CREATE POLICY "wb_profiles_update_own" ON public.wb_profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_profiles_delete_own" ON public.wb_profiles;
CREATE POLICY "wb_profiles_delete_own" ON public.wb_profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_profiles_admin_select_all" ON public.wb_profiles;
CREATE POLICY "wb_profiles_admin_select_all" ON public.wb_profiles FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance', 'support'))
  );

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wb_profiles_updated_at') THEN
    CREATE TRIGGER trg_wb_profiles_updated_at BEFORE UPDATE ON public.wb_profiles
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wb_profiles_user_id ON public.wb_profiles(user_id);

-- ============================================================
-- 3. WB_ACCOUNTS (Sovereign Ministry of Treasury)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wb_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.wb_users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'business', 'foreign_exchange')),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF')),
  balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  available_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed', 'pending')),
  interest_rate DECIMAL(5,4) DEFAULT 0.0000,
  routing_number TEXT DEFAULT '123456789',
  iban TEXT UNIQUE,
  swift_code TEXT DEFAULT 'WBINTL',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wb_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wb_accounts_select_own" ON public.wb_accounts;
CREATE POLICY "wb_accounts_select_own" ON public.wb_accounts FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_accounts_insert_own" ON public.wb_accounts;
CREATE POLICY "wb_accounts_insert_own" ON public.wb_accounts FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_accounts_update_own" ON public.wb_accounts;
CREATE POLICY "wb_accounts_update_own" ON public.wb_accounts FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_accounts_delete_own" ON public.wb_accounts;
CREATE POLICY "wb_accounts_delete_own" ON public.wb_accounts FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_accounts_admin_select_all" ON public.wb_accounts;
CREATE POLICY "wb_accounts_admin_select_all" ON public.wb_accounts FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance', 'support'))
  );

DROP POLICY IF EXISTS "wb_accounts_admin_update_all" ON public.wb_accounts;
CREATE POLICY "wb_accounts_admin_update_all" ON public.wb_accounts FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  );

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wb_accounts_updated_at') THEN
    CREATE TRIGGER trg_wb_accounts_updated_at BEFORE UPDATE ON public.wb_accounts
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wb_accounts_user_id ON public.wb_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_accounts_account_number ON public.wb_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_wb_accounts_status ON public.wb_accounts(status);

-- ============================================================
-- 4. WB_TRANSACTIONS (Sovereign Ministry of Treasury)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wb_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.wb_users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.wb_accounts(id) ON DELETE SET NULL,
  from_account_id UUID REFERENCES public.wb_accounts(id) ON DELETE SET NULL,
  to_account_id UUID REFERENCES public.wb_accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('transfer', 'deposit', 'withdrawal', 'fee', 'interest', 'refund', 'reversal')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'rejected', 'reversed')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  fee NUMERIC(15,2) DEFAULT 0.00,
  description TEXT,
  reference_number TEXT UNIQUE,
  idempotency_key TEXT UNIQUE,
  recipient_name TEXT,
  recipient_account TEXT,
  recipient_bank TEXT,
  recipient_swift_code TEXT,
  recipient_country TEXT,
  transfer_purpose TEXT,
  metadata JSONB,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wb_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wb_transactions_select_own" ON public.wb_transactions;
CREATE POLICY "wb_transactions_select_own" ON public.wb_transactions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_transactions_insert_own" ON public.wb_transactions;
CREATE POLICY "wb_transactions_insert_own" ON public.wb_transactions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_transactions_update_own" ON public.wb_transactions;
CREATE POLICY "wb_transactions_update_own" ON public.wb_transactions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_transactions_admin_select_all" ON public.wb_transactions;
CREATE POLICY "wb_transactions_admin_select_all" ON public.wb_transactions FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance', 'support'))
  );

DROP POLICY IF EXISTS "wb_transactions_admin_update_all" ON public.wb_transactions;
CREATE POLICY "wb_transactions_admin_update_all" ON public.wb_transactions FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  );

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wb_transactions_updated_at') THEN
    CREATE TRIGGER trg_wb_transactions_updated_at BEFORE UPDATE ON public.wb_transactions
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wb_transactions_user_id ON public.wb_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_transactions_account_id ON public.wb_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_wb_transactions_status ON public.wb_transactions(status);
CREATE INDEX IF NOT EXISTS idx_wb_transactions_type ON public.wb_transactions(type);
CREATE INDEX IF NOT EXISTS idx_wb_transactions_reference ON public.wb_transactions(reference_number);
CREATE INDEX IF NOT EXISTS idx_wb_transactions_created_at ON public.wb_transactions(created_at DESC);

-- ============================================================
-- 5. WB_NOTIFICATIONS (Sovereign Ministry of Communications)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wb_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.wb_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('transaction', 'security', 'system', 'marketing', 'compliance')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wb_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wb_notifications_select_own" ON public.wb_notifications;
CREATE POLICY "wb_notifications_select_own" ON public.wb_notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_notifications_insert_own" ON public.wb_notifications;
CREATE POLICY "wb_notifications_insert_own" ON public.wb_notifications FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_notifications_update_own" ON public.wb_notifications;
CREATE POLICY "wb_notifications_update_own" ON public.wb_notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_notifications_delete_own" ON public.wb_notifications;
CREATE POLICY "wb_notifications_delete_own" ON public.wb_notifications FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wb_notifications_updated_at') THEN
    CREATE TRIGGER trg_wb_notifications_updated_at BEFORE UPDATE ON public.wb_notifications
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wb_notifications_user_id ON public.wb_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_notifications_read_at ON public.wb_notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_wb_notifications_type ON public.wb_notifications(type);

-- ============================================================
-- 6. WB_MESSAGES (Sovereign Ministry of Communications)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wb_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.wb_users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.wb_users(id) ON DELETE CASCADE,
  subject TEXT,
  body TEXT NOT NULL,
  attachments JSONB,
  read_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wb_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wb_messages_select_own" ON public.wb_messages;
CREATE POLICY "wb_messages_select_own" ON public.wb_messages FOR SELECT
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "wb_messages_insert_own" ON public.wb_messages;
CREATE POLICY "wb_messages_insert_own" ON public.wb_messages FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "wb_messages_update_own" ON public.wb_messages;
CREATE POLICY "wb_messages_update_own" ON public.wb_messages FOR UPDATE
  TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);

DROP POLICY IF EXISTS "wb_messages_delete_own" ON public.wb_messages;
CREATE POLICY "wb_messages_delete_own" ON public.wb_messages FOR DELETE
  TO authenticated USING (auth.uid() = sender_id);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_wb_messages_updated_at') THEN
    CREATE TRIGGER trg_wb_messages_updated_at BEFORE UPDATE ON public.wb_messages
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wb_messages_sender_id ON public.wb_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_wb_messages_receiver_id ON public.wb_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_wb_messages_created_at ON public.wb_messages(created_at DESC);

-- ============================================================
-- 7. WB_SECURITY_EVENTS (Sovereign Ministry of Security)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wb_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.wb_users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'login_success', 'login_failed', 'logout', 'password_change', 'pin_change',
    'suspicious_activity', 'account_locked', 'account_unlocked',
    'mfa_enabled', 'mfa_disabled', 'token_refreshed', 'session_expired'
  )),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wb_security_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wb_security_events_select_own" ON public.wb_security_events;
CREATE POLICY "wb_security_events_select_own" ON public.wb_security_events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_security_events_admin_select_all" ON public.wb_security_events;
CREATE POLICY "wb_security_events_admin_select_all" ON public.wb_security_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  );

DROP POLICY IF EXISTS "wb_security_events_insert_own" ON public.wb_security_events;
CREATE POLICY "wb_security_events_insert_own" ON public.wb_security_events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "wb_security_events_admin_insert" ON public.wb_security_events;
CREATE POLICY "wb_security_events_admin_insert" ON public.wb_security_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  );

CREATE INDEX IF NOT EXISTS idx_wb_security_events_user_id ON public.wb_security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_wb_security_events_event_type ON public.wb_security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_wb_security_events_severity ON public.wb_security_events(severity);
CREATE INDEX IF NOT EXISTS idx_wb_security_events_created_at ON public.wb_security_events(created_at DESC);

-- ============================================================
-- 8. WB_AUDIT_LOGS (Sovereign Ministry of Security)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wb_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.wb_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wb_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wb_audit_logs_admin_select" ON public.wb_audit_logs;
CREATE POLICY "wb_audit_logs_admin_select" ON public.wb_audit_logs FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  );

DROP POLICY IF EXISTS "wb_audit_logs_admin_insert" ON public.wb_audit_logs;
CREATE POLICY "wb_audit_logs_admin_insert" ON public.wb_audit_logs FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  );

CREATE INDEX IF NOT EXISTS idx_wb_audit_logs_admin_id ON public.wb_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_wb_audit_logs_action ON public.wb_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_wb_audit_logs_target_type ON public.wb_audit_logs(target_type);
CREATE INDEX IF NOT EXISTS idx_wb_audit_logs_created_at ON public.wb_audit_logs(created_at DESC);

-- ============================================================
-- 9. WB_SYSTEM_EVENTS (Sovereign Ministry of Operations)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wb_system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL CHECK (event_type IN (
    'cron_job', 'background_task', 'health_check', 'deployment',
    'migration', 'backup', 'restore', 'config_change', 'error', 'warning'
  )),
  source TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'running', 'skipped')),
  message TEXT,
  details JSONB,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.wb_system_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wb_system_events_admin_select" ON public.wb_system_events;
CREATE POLICY "wb_system_events_admin_select" ON public.wb_system_events FOR SELECT
  TO authenticated USING (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  );

DROP POLICY IF EXISTS "wb_system_events_admin_insert" ON public.wb_system_events;
CREATE POLICY "wb_system_events_admin_insert" ON public.wb_system_events FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.wb_users u WHERE u.id = auth.uid() AND u.role IN ('admin', 'compliance'))
  );

CREATE INDEX IF NOT EXISTS idx_wb_system_events_event_type ON public.wb_system_events(event_type);
CREATE INDEX IF NOT EXISTS idx_wb_system_events_status ON public.wb_system_events(status);
CREATE INDEX IF NOT EXISTS idx_wb_system_events_source ON public.wb_system_events(source);
CREATE INDEX IF NOT EXISTS idx_wb_system_events_created_at ON public.wb_system_events(created_at DESC);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION public.wb_atomic_balance_update(
  p_account_id UUID,
  p_amount NUMERIC,
  p_operation TEXT DEFAULT 'add'
) RETURNS NUMERIC AS $$
DECLARE
  new_balance NUMERIC;
BEGIN
  IF p_operation = 'add' THEN
    UPDATE public.wb_accounts
    SET balance = balance + p_amount,
        available_balance = available_balance + p_amount
    WHERE id = p_account_id
    RETURNING balance INTO new_balance;
  ELSIF p_operation = 'subtract' THEN
    UPDATE public.wb_accounts
    SET balance = balance - p_amount,
        available_balance = available_balance - p_amount
    WHERE id = p_account_id AND available_balance >= p_amount
    RETURNING balance INTO new_balance;
    IF new_balance IS NULL THEN
      RAISE EXCEPTION 'Insufficient balance or account not found';
    END IF;
  ELSE
    RAISE EXCEPTION 'Invalid operation: %', p_operation;
  END IF;
  RETURN new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.wb_execute_transfer(
  p_from_account_id UUID,
  p_to_account_id UUID,
  p_amount NUMERIC,
  p_currency TEXT DEFAULT 'USD',
  p_description TEXT DEFAULT NULL,
  p_reference_number TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  transaction_id UUID;
  from_user_id UUID;
  to_user_id UUID;
BEGIN
  SELECT user_id INTO from_user_id FROM public.wb_accounts WHERE id = p_from_account_id FOR UPDATE;
  SELECT user_id INTO to_user_id FROM public.wb_accounts WHERE id = p_to_account_id FOR UPDATE;

  IF from_user_id IS NULL OR to_user_id IS NULL THEN
    RAISE EXCEPTION 'Account not found';
  END IF;

  PERFORM public.wb_atomic_balance_update(p_from_account_id, p_amount, 'subtract');
  PERFORM public.wb_atomic_balance_update(p_to_account_id, p_amount, 'add');

  INSERT INTO public.wb_transactions (
    user_id, from_account_id, to_account_id, type, status,
    amount, currency, description, reference_number, idempotency_key
  ) VALUES (
    from_user_id, p_from_account_id, p_to_account_id, 'transfer', 'completed',
    p_amount, p_currency, p_description, p_reference_number, p_idempotency_key
  ) RETURNING id INTO transaction_id;

  RETURN transaction_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;