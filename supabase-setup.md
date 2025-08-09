# Real Supabase Banking System Setup

## Step 1: Create New Supabase Project
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and name your project (e.g., "world-bank-app")
4. Set a strong database password
5. Choose region closest to you
6. Click "Create new project"

## Step 2: Get Your Project Credentials
Once your project is created:
1. Go to Settings → API
2. Copy your Project URL
3. Copy your anon/public API key
4. Copy your service_role key (for admin operations)

## Step 3: Database Schema Setup
Your banking system will use these tables with proper UUIDs:

### Users Table (extends Supabase auth.users)
```sql
-- User profiles with banking KYC data
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone_number TEXT,
  address JSONB,
  kyc_status TEXT DEFAULT 'pending',
  account_type TEXT DEFAULT 'personal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own profile
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

### Bank Accounts Table
```sql
-- Bank accounts with proper UUID primary keys
CREATE TABLE public.bank_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  account_number TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL,
  currency TEXT DEFAULT 'USD',
  balance DECIMAL(15,2) DEFAULT 0.00,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own accounts
CREATE POLICY "Users can view own accounts" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = user_id);
```

### Transactions Table
```sql
-- Transactions with UUID references
CREATE TABLE public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_account_id UUID REFERENCES public.bank_accounts(id),
  to_account_id UUID REFERENCES public.bank_accounts(id),
  amount DECIMAL(15,2) NOT NULL,
  currency TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  description TEXT,
  reference_number TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Users can view transactions for their accounts
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bank_accounts 
      WHERE (id = from_account_id OR id = to_account_id) 
      AND user_id = auth.uid()
    )
  );
```

### Real-time Messages Table
```sql
-- Chat messages for customer support
CREATE TABLE public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_name TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('admin', 'customer')),
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Users can view all messages (for chat)
CREATE POLICY "Users can view messages" ON public.messages
  FOR SELECT USING (true);

CREATE POLICY "Users can insert messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);
```

### Alerts/Notifications Table
```sql
-- Real-time alerts and notifications
CREATE TABLE public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('success', 'warning', 'error', 'info')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);
```

## Step 4: Enable Real-time
In your Supabase dashboard:
1. Go to Settings → API
2. Turn on Real-time for these tables:
   - messages
   - alerts
   - transactions
   - bank_accounts

## Step 5: Authentication Setup
1. Go to Authentication → Settings
2. Enable email authentication
3. Set up email templates if desired
4. Configure redirect URLs for your Replit domain

## Next Steps
After creating your Supabase project, provide me with:
1. Your Project URL
2. Your anon/public key
3. Your service role key

I'll then update your banking application to use the real Supabase instance with proper UUID implementation.