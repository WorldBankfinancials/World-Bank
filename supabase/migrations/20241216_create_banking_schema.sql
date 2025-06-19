-- Create banking application tables
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
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
  annual_income VARCHAR(50),
  id_type VARCHAR(50),
  id_number VARCHAR(50),
  transfer_pin VARCHAR(10),
  role VARCHAR(20) DEFAULT 'customer',
  is_verified BOOLEAN DEFAULT false,
  is_online BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  avatar_url TEXT,
  balance DECIMAL(15,2) DEFAULT 0.00,
  supabase_user_id UUID REFERENCES auth.users(id),
  last_login TIMESTAMP,
  created_by_admin INTEGER REFERENCES users(id),
  modified_by_admin INTEGER REFERENCES users(id),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Accounts table
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_number VARCHAR(50) UNIQUE NOT NULL,
  account_name VARCHAR(100),
  account_type VARCHAR(50) NOT NULL,
  balance DECIMAL(15,2) DEFAULT 0.00,
  currency VARCHAR(10) DEFAULT 'USD',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES accounts(id),
  transaction_type VARCHAR(50) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'USD',
  description TEXT,
  recipient_name VARCHAR(100),
  recipient_account VARCHAR(50),
  recipient_bank VARCHAR(100),
  recipient_swift VARCHAR(20),
  recipient_iban VARCHAR(50),
  recipient_address TEXT,
  transfer_purpose VARCHAR(100),
  reference_number VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  fee DECIMAL(10,2) DEFAULT 0.00,
  exchange_rate DECIMAL(10,4) DEFAULT 1.0000,
  processed_by INTEGER REFERENCES users(id),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin actions table
CREATE TABLE admin_actions (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  target_user_id INTEGER REFERENCES users(id),
  target_transaction_id INTEGER REFERENCES transactions(id),
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Support tickets table
CREATE TABLE support_tickets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(50) DEFAULT 'open',
  assigned_to INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type VARCHAR(100),
  is_verified BOOLEAN DEFAULT false,
  verified_by INTEGER REFERENCES users(id),
  verification_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_account_number ON users(account_number);
CREATE INDEX idx_users_supabase_user_id ON users(supabase_user_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_reference_number ON transactions(reference_number);
CREATE INDEX idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX idx_support_tickets_status ON support_tickets(status);
CREATE INDEX idx_documents_user_id ON documents(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = supabase_user_id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = supabase_user_id);
CREATE POLICY "Admins can view all users" ON users FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all users" ON users FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Allow user registration" ON users FOR INSERT WITH CHECK (true);

-- RLS Policies for accounts table
CREATE POLICY "Users can view own accounts" ON accounts FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
);
CREATE POLICY "Admins can view all accounts" ON accounts FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for transactions table
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
);
CREATE POLICY "Users can create transactions" ON transactions FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
);
CREATE POLICY "Admins can view all transactions" ON transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update transactions" ON transactions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for admin actions table
CREATE POLICY "Admins can view admin actions" ON admin_actions FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can create admin actions" ON admin_actions FOR INSERT WITH CHECK (
  admin_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for support tickets table
CREATE POLICY "Users can view own tickets" ON support_tickets FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
);
CREATE POLICY "Users can create tickets" ON support_tickets FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
);
CREATE POLICY "Admins can view all tickets" ON support_tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update tickets" ON support_tickets FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
);

-- RLS Policies for documents table
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
);
CREATE POLICY "Users can upload documents" ON documents FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE supabase_user_id = auth.uid())
);
CREATE POLICY "Admins can view all documents" ON documents FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE supabase_user_id = auth.uid() AND role = 'admin')
);

-- Insert demo admin user
INSERT INTO users (
  username, password, full_name, email, phone, account_number, account_id,
  profession, role, is_verified, is_active, balance
) VALUES (
  'admin', '$2b$10$K8gTsZFQxXWGYMJZQ5z5N.7rQ3QXc8xWFzFc5M9K1jVkZpHJzM8AW', -- password: admin123
  'System Administrator', 'admin@worldbank.com', '+1-555-0100',
  'ADMIN-0000-0000-0001', 'WB-ADMIN-001', 'Bank Administrator',
  'admin', true, true, 0.00
);

-- Insert demo customer (Mr. Liu Wei)
INSERT INTO users (
  username, password, full_name, email, phone, account_number, account_id,
  profession, date_of_birth, address, city, state, country, postal_code,
  annual_income, id_type, id_number, transfer_pin, role, is_verified, 
  is_online, is_active, balance
) VALUES (
  'liu.wei', '$2b$10$K8gTsZFQxXWGYMJZQ5z5N.7rQ3QXc8xWFzFc5M9K1jVkZpHJzM8AW', -- password: password123
  'Mr. Liu Wei', 'liu.wei@oilrig.com', '+86 138 0013 8000',
  '4789-6523-1087-9234', 'WB-2024-7829', 'Marine Engineer',
  '1985-03-15', '123 Harbor View Street', 'Shanghai', 'Shanghai',
  'China', '200000', '$85,000', 'National ID', '310115198503150123',
  '1234', 'customer', true, true, true, 47832.15
);

-- Create default account for Liu Wei
INSERT INTO accounts (user_id, account_number, account_name, account_type, balance, currency)
SELECT id, '4789-6523-1087-9234', 'Primary Checking', 'checking', 47832.15, 'USD'
FROM users WHERE username = 'liu.wei';

-- Create some demo transactions
INSERT INTO transactions (
  user_id, transaction_type, amount, description, recipient_name, 
  reference_number, status, created_at
)
SELECT 
  id, 'transfer_out', 2500.00, 'International wire transfer to family',
  'Wei Chen', 'TXN-2024-001', 'pending', NOW() - INTERVAL '1 day'
FROM users WHERE username = 'liu.wei';

INSERT INTO transactions (
  user_id, transaction_type, amount, description, 
  reference_number, status, created_at
)
SELECT 
  id, 'deposit', 5000.00, 'Salary deposit - Oil Rig Company',
  'TXN-2024-002', 'completed', NOW() - INTERVAL '3 days'
FROM users WHERE username = 'liu.wei';

-- Create demo support ticket
INSERT INTO support_tickets (
  user_id, title, description, category, priority, status
)
SELECT 
  id, 'Account verification assistance', 
  'Need help with completing account verification process.',
  'account', 'medium', 'open'
FROM users WHERE username = 'liu.wei';