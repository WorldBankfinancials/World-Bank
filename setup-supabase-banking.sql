-- World Bank Supabase Public Schema Setup with International Banking
-- Run this in your Supabase SQL Editor to create all banking tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Bank Users table (links to Supabase auth.users)
CREATE TABLE IF NOT EXISTS bank_users (
  id SERIAL PRIMARY KEY,
  supabase_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL DEFAULT 'supabase_auth',
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  phone VARCHAR(20),
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_id VARCHAR(50) UNIQUE NOT NULL,
  profession VARCHAR(100),
  date_of_birth DATE,
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  country VARCHAR(50),
  postal_code VARCHAR(20),
  nationality VARCHAR(50),
  annual_income VARCHAR(50),
  id_type VARCHAR(50),
  id_number VARCHAR(50),
  transfer_pin VARCHAR(10) NOT NULL,
  role VARCHAR(20) DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT true,
  is_online BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Bank Accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES bank_users(id) ON DELETE CASCADE,
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_type VARCHAR(20) NOT NULL, -- checking, savings, investment
  balance DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(3) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table for international banking
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  from_account_id INTEGER REFERENCES bank_accounts(id),
  to_account_id INTEGER REFERENCES bank_accounts(id),
  from_account_number VARCHAR(50),
  to_account_number VARCHAR(50),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  transaction_type VARCHAR(20) NOT NULL, -- transfer, deposit, withdrawal
  status VARCHAR(20) DEFAULT 'pending', -- pending, processing, completed, failed
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Messages table for realtime chat
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name VARCHAR(100) NOT NULL,
  sender_role VARCHAR(20) NOT NULL, -- admin, customer
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  conversation_id UUID,
  reply_to UUID REFERENCES messages(id),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Alerts table for realtime notifications
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL, -- success, warning, error, info
  category VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  action_url TEXT,
  action_label VARCHAR(100),
  expires_at TIMESTAMP,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert Wei Liu's banking data
INSERT INTO bank_users (
  supabase_user_id, username, full_name, email, phone, 
  account_number, account_id, profession, date_of_birth,
  address, city, state, country, postal_code, nationality,
  annual_income, id_type, id_number, transfer_pin, balance
) VALUES (
  '0633f82f-5306-41e9-9ed4-11ee555e5087',
  'vaa33053',
  'Wei Liu',
  'vaa33053@gmail.com',
  '+1 234 567 8900',
  '4789-5532-1098-7654',
  'WB-2025-8912',
  'Software Engineer',
  '1990-05-15',
  '123 Tech Street',
  'San Francisco',
  'California',
  'United States',
  '94102',
  'American',
  '$75,000-$100,000',
  'Passport',
  'P123456789',
  '0192',
  15750.50
) ON CONFLICT (email) DO UPDATE SET
  supabase_user_id = EXCLUDED.supabase_user_id,
  balance = EXCLUDED.balance,
  updated_at = NOW();

-- Insert bank accounts for Wei Liu
INSERT INTO bank_accounts (user_id, account_number, account_type, balance, currency) 
SELECT 
  bu.id,
  account_data.account_number,
  account_data.account_type,
  account_data.balance,
  account_data.currency
FROM bank_users bu
CROSS JOIN (
  VALUES 
    ('4789-5532-1098-7654', 'checking', 15750.50, 'USD'),
    ('4789-5532-1098-7655', 'savings', 25000.75, 'USD'),
    ('4789-5532-1098-7656', 'investment', 45000.00, 'USD')
) AS account_data(account_number, account_type, balance, currency)
WHERE bu.email = 'vaa33053@gmail.com'
ON CONFLICT (account_number) DO UPDATE SET
  balance = EXCLUDED.balance,
  updated_at = NOW();

-- Enable Row Level Security (RLS) for data protection
ALTER TABLE bank_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for secure access
CREATE POLICY IF NOT EXISTS "Users can view own data" ON bank_users
  FOR SELECT USING (supabase_user_id = auth.uid());

CREATE POLICY IF NOT EXISTS "Users can view own accounts" ON bank_accounts
  FOR SELECT USING (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()));

CREATE POLICY IF NOT EXISTS "Users can view own transactions" ON transactions
  FOR SELECT USING (
    from_account_id IN (SELECT id FROM bank_accounts WHERE user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()))
    OR to_account_id IN (SELECT id FROM bank_accounts WHERE user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()))
  );

-- Admin policies (service role can access everything)
CREATE POLICY IF NOT EXISTS "Service role can manage all data" ON bank_users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can manage all accounts" ON bank_accounts
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY IF NOT EXISTS "Service role can manage all transactions" ON transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Enable realtime for admin synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE bank_users;
ALTER PUBLICATION supabase_realtime ADD TABLE bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE transactions;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE alerts;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bank_users_supabase_id ON bank_users(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_bank_users_email ON bank_users(email);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_accounts ON transactions(from_account_id, to_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON alerts(user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;