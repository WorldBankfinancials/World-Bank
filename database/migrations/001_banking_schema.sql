-- Apex Banking Corporation
-- Real Supabase database schema with UUIDs and realistic banking structure

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles extending Supabase auth.users
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
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
  annual_income DECIMAL(15,2),
  identification_type TEXT, -- passport, driver_license, national_id
  identification_number TEXT,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'in_review', 'approved', 'rejected')),
  account_type TEXT DEFAULT 'personal' CHECK (account_type IN ('personal', 'business', 'premium')),
  preferred_language TEXT DEFAULT 'en',
  email_verified BOOLEAN DEFAULT FALSE,
  phone_verified BOOLEAN DEFAULT FALSE,
  identity_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank accounts with realistic account numbers
CREATE TABLE public.bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  routing_number TEXT DEFAULT '123456789',
  iban TEXT UNIQUE,
  swift_code TEXT DEFAULT 'APEXBNK',
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'business', 'foreign_exchange')),
  currency TEXT DEFAULT 'USD' CHECK (currency IN ('USD', 'EUR', 'GBP', 'JPY', 'CNY', 'CHF')),
  balance DECIMAL(15,2) DEFAULT 0.00,
  available_balance DECIMAL(15,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'frozen', 'closed', 'pending')),
  interest_rate DECIMAL(5,4) DEFAULT 0.0000,
  minimum_balance DECIMAL(15,2) DEFAULT 0.00,
  account_nickname TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions with comprehensive tracking
CREATE TABLE public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_account_id UUID REFERENCES public.bank_accounts(id),
  to_account_id UUID REFERENCES public.bank_accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL,
  exchange_rate DECIMAL(10,6) DEFAULT 1.000000,
  converted_amount DECIMAL(15,2),
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('transfer', 'deposit', 'withdrawal', 'payment', 'fee', 'interest')),
  category TEXT CHECK (category IN ('food', 'transport', 'shopping', 'healthcare', 'entertainment', 'utilities', 'salary', 'other')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  description TEXT,
  merchant_name TEXT,
  merchant_category TEXT,
  reference_number TEXT UNIQUE NOT NULL,
  external_reference TEXT,
  processing_fee DECIMAL(15,2) DEFAULT 0.00,
  memo TEXT,
  location JSONB,
  device_info JSONB,
  ip_address INET,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Real-time chat messages for customer support
CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'customer', 'agent')),
  message TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  conversation_id UUID,
  reply_to UUID REFERENCES public.messages(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time alerts and notifications
CREATE TABLE public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'warning', 'error', 'info', 'security', 'transaction')),
  category TEXT CHECK (category IN ('account', 'transaction', 'security', 'system', 'promotion')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  action_url TEXT,
  action_label TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transaction approvals for admin workflow
CREATE TABLE public.transaction_approvals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  admin_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  reason TEXT,
  notes TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cards and payment methods
CREATE TABLE public.cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  account_id UUID REFERENCES public.bank_accounts(id) ON DELETE CASCADE NOT NULL,
  card_number TEXT NOT NULL, -- Encrypted/masked in real implementation
  card_type TEXT NOT NULL CHECK (card_type IN ('debit', 'credit', 'prepaid')),
  brand TEXT CHECK (brand IN ('visa', 'mastercard', 'amex', 'discover')),
  expiry_month INTEGER CHECK (expiry_month >= 1 AND expiry_month <= 12),
  expiry_year INTEGER,
  cardholder_name TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'blocked', 'expired', 'cancelled')),
  daily_limit DECIMAL(15,2) DEFAULT 1000.00,
  monthly_limit DECIMAL(15,2) DEFAULT 10000.00,
  is_contactless BOOLEAN DEFAULT TRUE,
  pin_set BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Row Level Security Policies

-- User Profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Bank Accounts
CREATE POLICY "Users can view own accounts" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own accounts" ON public.bank_accounts
  FOR UPDATE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bank_accounts 
      WHERE (id = from_account_id OR id = to_account_id) 
      AND user_id = auth.uid()
    )
  );

-- Messages
CREATE POLICY "Users can view messages" ON public.messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Alerts
CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Cards
CREATE POLICY "Users can view own cards" ON public.cards
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bank_accounts 
      WHERE id = account_id AND user_id = auth.uid()
    )
  );

-- Functions for realistic data generation

-- Generate realistic account number
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'WB' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate realistic IBAN
CREATE OR REPLACE FUNCTION generate_iban(country_code TEXT DEFAULT 'US')
RETURNS TEXT AS $$
BEGIN
  RETURN country_code || LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0') || 'WRLD' || LPAD(FLOOR(RANDOM() * 1000000000000)::TEXT, 12, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate transaction reference number
CREATE OR REPLACE FUNCTION generate_transaction_reference()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TXN' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate account numbers
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

CREATE TRIGGER set_account_defaults_trigger
  BEFORE INSERT OR UPDATE ON public.bank_accounts
  FOR EACH ROW EXECUTE FUNCTION set_account_defaults();

-- Trigger to auto-generate transaction references
CREATE OR REPLACE FUNCTION set_transaction_defaults()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := generate_transaction_reference();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_transaction_defaults_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION set_transaction_defaults();

-- Indexes for performance
CREATE INDEX idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX idx_transactions_from_account ON public.transactions(from_account_id);
CREATE INDEX idx_transactions_to_account ON public.transactions(to_account_id);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX idx_alerts_created_at ON public.alerts(created_at);