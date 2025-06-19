
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  full_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  occupation TEXT NOT NULL,
  annual_income TEXT NOT NULL,
  id_type TEXT NOT NULL,
  id_number TEXT NOT NULL,
  transfer_pin TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'business')),
  balance DECIMAL(15,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_account_id UUID REFERENCES accounts(id),
  to_account_id UUID REFERENCES accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_by UUID REFERENCES auth.users,
  approved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_account_number ON accounts(account_number);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Create RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only see and edit their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Account policies
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Transaction policies
CREATE POLICY "Users can view own transactions" ON transactions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE (accounts.id = transactions.from_account_id OR accounts.id = transactions.to_account_id) 
      AND accounts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create transactions from own accounts" ON transactions 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM accounts 
      WHERE accounts.id = transactions.from_account_id 
      AND accounts.user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
