-- Run this SQL in your Supabase SQL Editor to set up the banking database
-- Go to: Supabase Dashboard > SQL Editor > New Query

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles extending Supabase auth.users
CREATE TABLE IF NOT EXISTS public.user_profiles (
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
  identification_type TEXT,
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
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  routing_number TEXT DEFAULT '123456789',
  iban TEXT UNIQUE,
  swift_code TEXT DEFAULT 'WORLDBNK',
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'investment', 'business')),
  currency TEXT DEFAULT 'USD',
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
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_account_id UUID REFERENCES public.bank_accounts(id),
  to_account_id UUID REFERENCES public.bank_accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('transfer', 'deposit', 'withdrawal', 'payment', 'fee')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  description TEXT,
  reference_number TEXT UNIQUE NOT NULL,
  processing_fee DECIMAL(15,2) DEFAULT 0.00,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Real-time messages for customer support
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'customer', 'agent')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time alerts and notifications
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'warning', 'error', 'info', 'security', 'transaction')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for bank_accounts
DROP POLICY IF EXISTS "Users can view own accounts" ON public.bank_accounts;
CREATE POLICY "Users can view own accounts" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id);

-- RLS Policies for transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bank_accounts 
      WHERE (id = from_account_id OR id = to_account_id) 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for messages
DROP POLICY IF EXISTS "Users can view messages" ON public.messages;
CREATE POLICY "Users can view messages" ON public.messages
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert messages" ON public.messages;
CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- RLS Policies for alerts
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

-- Functions for realistic data generation
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'WB' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_iban(country_code TEXT DEFAULT 'US')
RETURNS TEXT AS $$
BEGIN
  RETURN country_code || LPAD(FLOOR(RANDOM() * 100)::TEXT, 2, '0') || 'WRLD' || LPAD(FLOOR(RANDOM() * 1000000000000)::TEXT, 12, '0');
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS set_account_defaults_trigger ON public.bank_accounts;
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

DROP TRIGGER IF EXISTS set_transaction_defaults_trigger ON public.transactions;
CREATE TRIGGER set_transaction_defaults_trigger
  BEFORE INSERT ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION set_transaction_defaults();

-- Create some initial data for testing (you can run this after setting up auth)
-- This will be commented out for now
/*
-- Sample alert for testing real-time features
INSERT INTO public.alerts (user_id, title, message, type) VALUES 
('YOUR_USER_ID_HERE', 'Welcome to World Bank', 'Your account has been successfully created!', 'success');

-- Sample message for testing chat
INSERT INTO public.messages (sender_id, sender_name, sender_role, message) VALUES 
('YOUR_USER_ID_HERE', 'Customer Support', 'admin', 'Welcome! How can we help you today?');
*/

-- Success message
SELECT 'Banking database schema created successfully! ✅' as status;