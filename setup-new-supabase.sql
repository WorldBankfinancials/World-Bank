
-- World Bank Banking System Database Schema
-- Real-time enabled hybrid banking application

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  account_number TEXT UNIQUE,
  account_id TEXT UNIQUE,
  profession TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  annual_income TEXT,
  id_type TEXT,
  id_number TEXT,
  transfer_pin TEXT DEFAULT '1234',
  role TEXT DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT false,
  is_online BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  balance DECIMAL(15,2) DEFAULT 0.00,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bank accounts table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  account_type TEXT DEFAULT 'checking',
  balance DECIMAL(15,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions table
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.bank_accounts(id),
  transaction_type TEXT NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  recipient_name TEXT,
  recipient_account TEXT,
  recipient_bank TEXT,
  recipient_swift TEXT,
  recipient_iban TEXT,
  recipient_address TEXT,
  transfer_purpose TEXT,
  reference_number TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  fee DECIMAL(15,2) DEFAULT 0.00,
  exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
  processed_by UUID,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Messages table for real-time chat
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  sender_role TEXT CHECK (sender_role IN ('admin', 'customer')) DEFAULT 'customer',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alerts table for real-time notifications
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT CHECK (type IN ('success', 'warning', 'error', 'info')) DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin actions table
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  target_transaction_id UUID,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Service role full access profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for bank_accounts
CREATE POLICY "Users can view own accounts" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access accounts" ON public.bank_accounts
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access transactions" ON public.transactions
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for messages (global read for support)
CREATE POLICY "Anyone can read messages" ON public.messages
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can send messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Service role full access messages" ON public.messages
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for alerts
CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role full access alerts" ON public.alerts
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for support tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role full access tickets" ON public.support_tickets
  FOR ALL USING (auth.role() = 'service_role');

-- RLS Policies for admin actions
CREATE POLICY "Service role full access admin actions" ON public.admin_actions
  FOR ALL USING (auth.role() = 'service_role');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON public.bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_account_number ON public.bank_accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_reference ON public.transactions(reference_number);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON public.alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts(created_at);

-- Functions for automatic account generation
CREATE OR REPLACE FUNCTION generate_account_number()
RETURNS TEXT AS $$
BEGIN
  RETURN CONCAT(
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'), '-',
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'), '-',
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'), '-',
    LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0')
  );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_account_id()
RETURNS TEXT AS $$
BEGIN
  RETURN CONCAT('WB-', EXTRACT(YEAR FROM NOW()), '-', LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0'));
END;
$$ LANGUAGE plpgsql;

-- Trigger function to create user profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id, 
    full_name, 
    email,
    account_number,
    account_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Banking Customer'),
    NEW.email,
    generate_account_number(),
    generate_account_id()
  );
  
  -- Create default checking account
  INSERT INTO public.bank_accounts (
    user_id,
    account_number,
    account_name,
    account_type,
    balance
  )
  VALUES (
    NEW.id,
    generate_account_number(),
    'Primary Checking',
    'checking',
    0.00
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert test admin user for your existing email
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  uuid_generate_v4(),
  'bankmanagerworld5@gmail.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Liu Wei", "role": "admin"}'::jsonb
) ON CONFLICT (email) DO NOTHING;
