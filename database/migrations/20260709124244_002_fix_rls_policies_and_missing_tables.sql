/*
# Fix RLS Policies and Add Missing Tables

## Summary
Fixes critical RLS policy gaps preventing the banking app from functioning,
and adds 3 missing tables required by the server storage layer.

## Problems Fixed
1. bank_accounts: No INSERT/DELETE policy — users cannot create or remove accounts
2. transactions: No INSERT/UPDATE policy — transfers cannot be created or updated
3. cards: No INSERT/UPDATE/DELETE policy — cards cannot be managed
4. alerts: No INSERT/DELETE policy — alerts cannot be created or removed
5. messages: SELECT policy uses USING(true) — all users can read ALL messages
6. transaction_approvals: RLS enabled but ZERO policies — all access denied
7. user_profiles: No DELETE policy

## New Tables
- admin_actions: Logs admin operations (approvals, rejections, manual adjustments)
- support_tickets: Customer support ticket system
- investments: User investment portfolio holdings

## Security Changes
- Messages SELECT policy tightened to only show messages where user is sender
- transaction_approvals gets admin-only access policies (checked via user_profiles.account_type = 'admin')
- All policies use auth.uid() for ownership checks
- All new tables get RLS enabled with owner-scoped policies
*/

-- ============================================================
-- FIX 1: bank_accounts — add INSERT and DELETE policies
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own accounts" ON bank_accounts;
CREATE POLICY "Users can insert own accounts"
  ON bank_accounts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own accounts" ON bank_accounts;
CREATE POLICY "Users can delete own accounts"
  ON bank_accounts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- FIX 2: transactions — add INSERT and UPDATE policies
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own transactions" ON transactions;
CREATE POLICY "Users can insert own transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_accounts
      WHERE bank_accounts.id = transactions.from_account_id
      AND bank_accounts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own transactions" ON transactions;
CREATE POLICY "Users can update own transactions"
  ON transactions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bank_accounts
      WHERE (bank_accounts.id = transactions.from_account_id OR bank_accounts.id = transactions.to_account_id)
      AND bank_accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_accounts
      WHERE (bank_accounts.id = transactions.from_account_id OR bank_accounts.id = transactions.to_account_id)
      AND bank_accounts.user_id = auth.uid()
    )
  );

-- ============================================================
-- FIX 3: cards — add INSERT, UPDATE, DELETE policies
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own cards" ON cards;
CREATE POLICY "Users can insert own cards"
  ON cards FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_accounts
      WHERE bank_accounts.id = cards.account_id
      AND bank_accounts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own cards" ON cards;
CREATE POLICY "Users can update own cards"
  ON cards FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bank_accounts
      WHERE bank_accounts.id = cards.account_id
      AND bank_accounts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bank_accounts
      WHERE bank_accounts.id = cards.account_id
      AND bank_accounts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own cards" ON cards;
CREATE POLICY "Users can delete own cards"
  ON cards FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bank_accounts
      WHERE bank_accounts.id = cards.account_id
      AND bank_accounts.user_id = auth.uid()
    )
  );

-- ============================================================
-- FIX 4: alerts — add INSERT and DELETE policies
-- ============================================================
DROP POLICY IF EXISTS "Users can insert own alerts" ON alerts;
CREATE POLICY "Users can insert own alerts"
  ON alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own alerts" ON alerts;
CREATE POLICY "Users can delete own alerts"
  ON alerts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- FIX 5: messages — tighten SELECT policy (was USING(true))
-- ============================================================
DROP POLICY IF EXISTS "Users can view messages" ON messages;
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON messages;
CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can delete own messages" ON messages;
CREATE POLICY "Users can delete own messages"
  ON messages FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id);

-- ============================================================
-- FIX 6: transaction_approvals — add admin-only policies
-- ============================================================
DROP POLICY IF EXISTS "Admins can view transaction approvals" ON transaction_approvals;
CREATE POLICY "Admins can view transaction approvals"
  ON transaction_approvals FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.account_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert transaction approvals" ON transaction_approvals;
CREATE POLICY "Admins can insert transaction approvals"
  ON transaction_approvals FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.account_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update transaction approvals" ON transaction_approvals;
CREATE POLICY "Admins can update transaction approvals"
  ON transaction_approvals FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.account_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.account_type = 'admin'
    )
  );

-- ============================================================
-- FIX 7: user_profiles — add DELETE policy
-- ============================================================
DROP POLICY IF EXISTS "Users can delete own profile" ON user_profiles;
CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- ============================================================
-- NEW TABLE: admin_actions
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_type text,
  target_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin actions" ON admin_actions;
CREATE POLICY "Admins can view admin actions"
  ON admin_actions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.account_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can insert admin actions" ON admin_actions;
CREATE POLICY "Admins can insert admin actions"
  ON admin_actions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.account_type = 'admin'
    )
  );

-- ============================================================
-- NEW TABLE: support_tickets
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text,
  priority text DEFAULT 'normal' CHECK (priority = ANY (ARRAY['low', 'normal', 'high', 'urgent'])),
  status text DEFAULT 'open' CHECK (status = ANY (ARRAY['open', 'in_progress', 'resolved', 'closed'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own tickets" ON support_tickets;
CREATE POLICY "Users can view own tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own tickets" ON support_tickets;
CREATE POLICY "Users can insert own tickets"
  ON support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own tickets" ON support_tickets;
CREATE POLICY "Users can update own tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all tickets" ON support_tickets;
CREATE POLICY "Admins can view all tickets"
  ON support_tickets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.account_type = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update all tickets" ON support_tickets;
CREATE POLICY "Admins can update all tickets"
  ON support_tickets FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.account_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.account_type = 'admin'
    )
  );

-- ============================================================
-- NEW TABLE: investments
-- ============================================================
CREATE TABLE IF NOT EXISTS investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  symbol text NOT NULL,
  shares numeric NOT NULL DEFAULT 0,
  average_price numeric NOT NULL DEFAULT 0,
  current_price numeric NOT NULL DEFAULT 0,
  status text DEFAULT 'active' CHECK (status = ANY (ARRAY['active', 'sold', 'pending'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own investments" ON investments;
CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own investments" ON investments;
CREATE POLICY "Users can insert own investments"
  ON investments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own investments" ON investments;
CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own investments" ON investments;
CREATE POLICY "Users can delete own investments"
  ON investments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_from_account ON transactions(from_account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_to_account ON transactions(to_account_id);
CREATE INDEX IF NOT EXISTS idx_cards_account_id ON cards(account_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user_id ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);