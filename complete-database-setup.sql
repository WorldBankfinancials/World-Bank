-- Complete Banking Database Setup for World Bank Digital Platform
-- Run this SQL in your Supabase SQL Editor: Dashboard > SQL Editor > New Query

-- ============================================================================
-- STEP 1: Enable Required Extensions
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 2: Create All Banking Tables
-- ============================================================================

-- User Profiles Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  phone_number TEXT,
  country_code TEXT DEFAULT '+1',
  address JSONB DEFAULT '{}'::jsonb,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  country TEXT,
  nationality TEXT,
  occupation TEXT,
  employer TEXT,
  annual_income DECIMAL(15,2),
  identification_type TEXT CHECK (identification_type IN ('passport', 'drivers_license', 'national_id', 'social_security')),
  identification_number TEXT,
  tax_id TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_review', 'approved', 'rejected')),
  account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'premium', 'corporate')),
  preferred_language TEXT DEFAULT 'en',
  preferred_currency TEXT DEFAULT 'USD',
  time_zone TEXT DEFAULT 'UTC',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  pin_hash TEXT, -- For transaction security
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  login_attempts INTEGER DEFAULT 0,
  account_locked_until TIMESTAMP WITH TIME ZONE,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank Accounts Table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  routing_number TEXT DEFAULT '123456789',
  iban TEXT UNIQUE,
  bic_swift_code TEXT DEFAULT 'WORLDBNK',
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'business', 'money_market', 'cd')),
  account_subtype TEXT,
  currency TEXT DEFAULT 'USD',
  balance DECIMAL(15,2) DEFAULT 0.00 CHECK (balance >= -10000.00), -- Allow small overdrafts
  available_balance DECIMAL(15,2) DEFAULT 0.00,
  pending_balance DECIMAL(15,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed', 'pending', 'suspended')),
  interest_rate DECIMAL(5,4) DEFAULT 0.0000,
  minimum_balance DECIMAL(15,2) DEFAULT 0.00,
  overdraft_limit DECIMAL(15,2) DEFAULT 0.00,
  account_nickname TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  auto_pay_enabled BOOLEAN DEFAULT FALSE,
  statements_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions Table (comprehensive transaction tracking)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_account_id UUID REFERENCES public.bank_accounts(id),
  to_account_id UUID REFERENCES public.bank_accounts(id),
  external_account_info JSONB, -- For external transfers
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'USD',
  exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
  converted_amount DECIMAL(15,2),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('transfer', 'deposit', 'withdrawal', 'payment', 'fee', 'interest', 'refund', 'chargeback')),
  transaction_method TEXT CHECK (transaction_method IN ('ach', 'wire', 'check', 'atm', 'online', 'mobile', 'branch')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed')),
  description TEXT,
  memo TEXT,
  reference_number TEXT UNIQUE NOT NULL,
  external_reference TEXT,
  processing_fee DECIMAL(15,2) DEFAULT 0.00,
  total_amount DECIMAL(15,2) GENERATED ALWAYS AS (amount + processing_fee) STORED,
  category TEXT,
  tags TEXT[],
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  scheduled_date DATE,
  recurring_pattern TEXT CHECK (recurring_pattern IN ('none', 'daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  failed_reason TEXT,
  
  -- Constraints
  CONSTRAINT valid_account_transfer CHECK (
    (from_account_id IS NOT NULL AND to_account_id IS NOT NULL AND from_account_id != to_account_id) OR
    (from_account_id IS NOT NULL AND external_account_info IS NOT NULL) OR
    (to_account_id IS NOT NULL AND external_account_info IS NOT NULL)
  )
);

-- Cards Table (Debit/Credit Cards)
CREATE TABLE IF NOT EXISTS public.cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_id UUID REFERENCES public.bank_accounts(id) ON DELETE CASCADE NOT NULL,
  card_number_masked TEXT NOT NULL, -- Only last 4 digits shown: ****-****-****-1234
  card_number_hash TEXT NOT NULL, -- Encrypted full number
  card_type TEXT NOT NULL CHECK (card_type IN ('debit', 'credit', 'prepaid', 'business')),
  card_brand TEXT CHECK (card_brand IN ('visa', 'mastercard', 'american_express', 'discover')),
  expiry_month INTEGER CHECK (expiry_month BETWEEN 1 AND 12),
  expiry_year INTEGER CHECK (expiry_year >= EXTRACT(YEAR FROM CURRENT_DATE)),
  cvv_hash TEXT, -- Encrypted CVV
  cardholder_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired', 'cancelled', 'pending')),
  pin_hash TEXT, -- Encrypted PIN
  daily_limit DECIMAL(15,2) DEFAULT 1000.00,
  monthly_limit DECIMAL(15,2) DEFAULT 10000.00,
  international_enabled BOOLEAN DEFAULT FALSE,
  contactless_enabled BOOLEAN DEFAULT TRUE,
  online_purchases_enabled BOOLEAN DEFAULT TRUE,
  atm_withdrawals_enabled BOOLEAN DEFAULT TRUE,
  issued_date DATE DEFAULT CURRENT_DATE,
  activation_date DATE,
  last_used_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Messages Table (Customer Support Chat)
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'customer', 'agent', 'system')),
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system', 'notification')),
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  reply_to_id UUID REFERENCES public.messages(id),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time Alerts/Notifications Table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'warning', 'error', 'info', 'security', 'transaction', 'account', 'system')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  category TEXT,
  action_url TEXT,
  action_label TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Account Statements Table
CREATE TABLE IF NOT EXISTS public.account_statements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.bank_accounts(id) ON DELETE CASCADE NOT NULL,
  statement_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  opening_balance DECIMAL(15,2) NOT NULL,
  closing_balance DECIMAL(15,2) NOT NULL,
  total_deposits DECIMAL(15,2) DEFAULT 0.00,
  total_withdrawals DECIMAL(15,2) DEFAULT 0.00,
  total_fees DECIMAL(15,2) DEFAULT 0.00,
  interest_earned DECIMAL(15,2) DEFAULT 0.00,
  statement_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Beneficiaries Table (Saved Transfer Recipients)
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nickname TEXT NOT NULL,
  beneficiary_name TEXT NOT NULL,
  account_number TEXT,
  routing_number TEXT,
  iban TEXT,
  swift_code TEXT,
  bank_name TEXT,
  bank_address JSONB,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  beneficiary_type TEXT DEFAULT 'individual' CHECK (beneficiary_type IN ('individual', 'business', 'organization')),
  relationship TEXT,
  is_verified BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: Create Indexes for Performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_kyc_status ON public.user_profiles(kyc_status);
CREATE INDEX IF NOT EXISTS idx_user_profiles_account_type ON public.user_profiles(account_type);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_status ON public.bank_accounts(status);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_account_type ON public.bank_accounts(account_type);

CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON public.transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON public.transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference_number);

CREATE INDEX IF NOT EXISTS idx_cards_user_id ON public.cards(user_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON public.cards(account_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON public.cards(status);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON public.alerts(is_read);

CREATE INDEX IF NOT EXISTS idx_beneficiaries_user_id ON public.beneficiaries(user_id);

-- ============================================================================
-- STEP 4: Enable Row Level Security
-- ============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 5: Create Row Level Security Policies
-- ============================================================================

-- User Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Bank Accounts Policies
DROP POLICY IF EXISTS "Users can view own accounts" ON public.bank_accounts;
CREATE POLICY "Users can view own accounts" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own accounts" ON public.bank_accounts;
CREATE POLICY "Users can update own accounts" ON public.bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions Policies
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bank_accounts 
      WHERE (id = from_account_id OR id = to_account_id) 
      AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create transactions" ON public.transactions;
CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.bank_accounts 
      WHERE id = from_account_id 
      AND user_id = auth.uid()
    )
  );

-- Cards Policies
DROP POLICY IF EXISTS "Users can view own cards" ON public.cards;
CREATE POLICY "Users can view own cards" ON public.cards
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own cards" ON public.cards;
CREATE POLICY "Users can update own cards" ON public.cards
  FOR UPDATE USING (auth.uid() = user_id);

-- Messages Policies
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Users can view messages" ON public.messages
  FOR SELECT USING (true); -- Public chat visibility

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Alerts Policies
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own alerts" ON public.alerts;
CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Beneficiaries Policies
DROP POLICY IF EXISTS "Users can manage own beneficiaries" ON public.beneficiaries;
CREATE POLICY "Users can manage own beneficiaries" ON public.beneficiaries
  FOR ALL USING (auth.uid() = user_id);

-- Account Statements Policies
DROP POLICY IF EXISTS "Users can view own statements" ON public.account_statements;
CREATE POLICY "Users can view own statements" ON public.account_statements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bank_accounts 
      WHERE id = account_id 
      AND user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 6: Create Helper Functions
-- ============================================================================

-- Generate realistic account numbers
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'WB' || LPAD(FLOOR(RANDOM() * 1000000000)::TEXT, 10, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate IBAN
CREATE OR REPLACE FUNCTION generate_iban(country_code TEXT DEFAULT 'US')
RETURNS TEXT AS $$
BEGIN
  RETURN country_code || LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0') || 'WRLD' || LPAD(FLOOR(RANDOM() * 10000000000000000)::TEXT, 16, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate transaction reference
CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000000)::TEXT, 7, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate masked card number
CREATE OR REPLACE FUNCTION mask_card_number(full_number TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN '****-****-****-' || RIGHT(full_number, 4);
END;
$$ LANGUAGE plpgsql;

-- Update account balances after transactions
CREATE OR REPLACE FUNCTION update_account_balances()
RETURNS TRIGGER AS $$
BEGIN
  -- Update source account
  IF NEW.from_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts 
    SET balance = balance - NEW.total_amount,
        updated_at = NOW()
    WHERE id = NEW.from_account_id;
  END IF;

  -- Update destination account
  IF NEW.to_account_id IS NOT NULL THEN
    UPDATE public.bank_accounts 
    SET balance = balance + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.to_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 7: Create Triggers
-- ============================================================================

-- Auto-generate account details
CREATE OR REPLACE FUNCTION set_account_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.account_number IS NULL THEN
    NEW.account_number := generate_account_number();
  END IF;
  
  IF NEW.iban IS NULL THEN
    NEW.iban := generate_iban();
  END IF;
  
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_account_defaults_trigger ON public.bank_accounts;
CREATE TRIGGER set_account_defaults_trigger
  BEFORE INSERT OR UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION set_account_defaults();

-- Auto-generate transaction references
CREATE OR REPLACE FUNCTION set_transaction_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_transaction_reference();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_transaction_defaults_trigger ON public.transactions;
CREATE TRIGGER set_transaction_defaults_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION set_transaction_defaults();

-- Update balances when transactions are completed
DROP TRIGGER IF EXISTS update_balances_trigger ON public.transactions;
CREATE TRIGGER update_balances_trigger
  AFTER UPDATE ON public.transactions
  FOR EACH ROW 
  WHEN (OLD.status != 'completed' AND NEW.status = 'completed')
  EXECUTE FUNCTION update_account_balances();

-- ============================================================================
-- STEP 8: Create Admin Functions
-- ============================================================================

-- Function to create a complete user profile with default account
CREATE OR REPLACE FUNCTION create_user_with_account(
  user_uuid UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT DEFAULT NULL,
  country TEXT DEFAULT 'United States',
  account_type TEXT DEFAULT 'checking'
)
RETURNS JSON AS $$
DECLARE
  profile_id UUID;
  account_id UUID;
  result JSON;
BEGIN
  -- Create user profile
  INSERT INTO public.user_profiles (
    id, full_name, phone_number, country, account_type, email_verified
  ) VALUES (
    user_uuid, full_name, phone, country, 'personal', true
  ) RETURNING id INTO profile_id;

  -- Create default bank account
  INSERT INTO public.bank_accounts (
    user_id, account_type, currency, balance, is_primary
  ) VALUES (
    user_uuid, account_type, 'USD', 1000.00, true
  ) RETURNING id INTO account_id;

  -- Create welcome alert
  INSERT INTO public.alerts (
    user_id, title, message, type
  ) VALUES (
    user_uuid, 
    'Welcome to World Bank', 
    'Your account has been successfully created! Your account number is ready for use.',
    'success'
  );

  -- Return success result
  result := json_build_object(
    'success', true,
    'user_id', user_uuid,
    'account_id', account_id,
    'message', 'User profile and account created successfully'
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
SELECT 'World Bank Banking Database Setup Complete! 🏦✅' as status,
       'Tables: user_profiles, bank_accounts, transactions, cards, messages, alerts, account_statements, beneficiaries' as tables_created,
       'Next: Update your .env file and enable real-time features' as next_step;