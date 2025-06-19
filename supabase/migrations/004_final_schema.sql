
-- Drop all existing tables and recreate with proper structure
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table matching our app requirements
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  user_id TEXT UNIQUE,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  middle_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  nationality TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  postal_code TEXT,
  occupation TEXT,
  employer TEXT,
  annual_income TEXT,
  source_of_income TEXT,
  id_type TEXT,
  id_number TEXT,
  id_expiry_date DATE,
  issuing_country TEXT,
  transfer_pin TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own data
CREATE POLICY "Users can access their own data" ON users
  FOR ALL USING (auth.uid() = id);

-- Create accounts table
CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT,
  account_type TEXT NOT NULL CHECK (account_type IN ('checking', 'savings', 'business')),
  balance DECIMAL(15,2) DEFAULT 0.00,
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own accounts" ON accounts
  FOR ALL USING (auth.uid() = user_id);

-- Create transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_account_id UUID REFERENCES accounts(id),
  to_account_id UUID REFERENCES accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  transaction_type TEXT DEFAULT 'transfer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own transactions" ON transactions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM accounts WHERE id = from_account_id
      UNION
      SELECT user_id FROM accounts WHERE id = to_account_id
    )
  );

-- Insert test user data with proper UUID
DO $$
DECLARE
    test_user_id UUID := '6e2bdefa-c205-4967-9021-2c666de3718f';
BEGIN
    -- Insert test user
    INSERT INTO users (
      id, 
      email, 
      user_id, 
      full_name, 
      first_name,
      last_name,
      phone,
      date_of_birth,
      address,
      city,
      country,
      occupation,
      annual_income,
      transfer_pin,
      is_verified
    ) VALUES (
      test_user_id,
      'liu.wei@example.com',
      'WB123456',
      'Liu Wei',
      'Liu',
      'Wei',
      '+1234567890',
      '1990-01-01',
      '123 Main Street',
      'New York',
      'US',
      'Software Engineer',
      '100k-250k',
      '123456',
      true
    ) ON CONFLICT (id) DO UPDATE SET
      user_id = EXCLUDED.user_id,
      full_name = EXCLUDED.full_name,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      transfer_pin = EXCLUDED.transfer_pin;

    -- Insert test accounts
    INSERT INTO accounts (user_id, account_number, account_name, account_type, balance, currency)
    VALUES 
      (test_user_id, '1001234567', 'Primary Checking', 'checking', 15250.75, 'USD'),
      (test_user_id, '2001234567', 'Savings Account', 'savings', 45000.00, 'USD')
    ON CONFLICT (account_number) DO UPDATE SET
      account_name = EXCLUDED.account_name,
      balance = EXCLUDED.balance;
END $$;
