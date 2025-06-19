
-- Fix users table to use UUID for id instead of integer
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;

-- Create users table with UUID primary key to match Supabase auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
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
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
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

-- Insert some sample data for testing
INSERT INTO users (id, email, username, full_name, phone) 
VALUES (
  '6e2bdefa-c205-4967-9021-2c666de3718f',
  'liu.wei@example.com',
  'liu.wei',
  'Liu Wei',
  '+1234567890'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO accounts (user_id, account_number, account_type, balance, currency)
VALUES 
  ('6e2bdefa-c205-4967-9021-2c666de3718f', '1001234567', 'checking', 15250.75, 'USD'),
  ('6e2bdefa-c205-4967-9021-2c666de3718f', '2001234567', 'savings', 45000.00, 'USD')
ON CONFLICT (account_number) DO NOTHING;

INSERT INTO transactions (from_account_id, to_account_id, amount, currency, description, status, created_at)
SELECT 
  a1.id,
  a2.id,
  500.00,
  'USD',
  'Transfer to Savings',
  'completed',
  NOW() - INTERVAL '2 days'
FROM accounts a1, accounts a2
WHERE a1.account_number = '1001234567' 
  AND a2.account_number = '2001234567'
ON CONFLICT DO NOTHING;
