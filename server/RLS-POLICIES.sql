-- CRITICAL: Row Level Security (RLS) Policies for World Bank App
-- This file MUST be executed in Supabase SQL Editor to enable security
-- Run this BEFORE deploying to production

-- SECURITY: Enable RLS on all tables
ALTER TABLE bank_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_pending_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_support_tickets ENABLE ROW LEVEL SECURITY;

-- ===== BANK_USERS POLICIES =====
-- Users can read their own profile only
CREATE POLICY "Users can read own profile"
  ON bank_users
  FOR SELECT
  USING (auth.uid()::text = supabase_user_id OR
         (SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON bank_users
  FOR UPDATE
  USING (auth.uid()::text = supabase_user_id)
  WITH CHECK (auth.uid()::text = supabase_user_id);

-- Admin can read all users
CREATE POLICY "Admins can read all users"
  ON bank_users
  FOR SELECT
  USING ((SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- ===== BANK_ACCOUNTS POLICIES =====
-- Users can read their own accounts
CREATE POLICY "Users can read own accounts"
  ON bank_accounts
  FOR SELECT
  USING (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text) OR
         (SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Users can update their own accounts
CREATE POLICY "Users can update own accounts"
  ON bank_accounts
  FOR UPDATE
  USING (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text))
  WITH CHECK (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text));

-- ===== BANK_TRANSACTIONS POLICIES =====
-- Users can read their own transactions
CREATE POLICY "Users can read own transactions"
  ON bank_transactions
  FOR SELECT
  USING (account_id IN (SELECT id FROM bank_accounts WHERE user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text)) OR
         (SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- ===== BANK_TRANSFERS POLICIES =====
-- Users can read their own transfers
CREATE POLICY "Users can read own transfers"
  ON bank_transfers
  FOR SELECT
  USING (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text) OR
         (SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Users can create their own transfers
CREATE POLICY "Users can create own transfers"
  ON bank_transfers
  FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text));

-- ===== BANK_CARDS POLICIES =====
-- Users can read their own cards
CREATE POLICY "Users can read own cards"
  ON bank_cards
  FOR SELECT
  USING (account_id IN (SELECT id FROM bank_accounts WHERE user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text)) OR
         (SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Users can update their own cards
CREATE POLICY "Users can update own cards"
  ON bank_cards
  FOR UPDATE
  USING (account_id IN (SELECT id FROM bank_accounts WHERE user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text)))
  WITH CHECK (account_id IN (SELECT id FROM bank_accounts WHERE user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text)));

-- ===== BANK_ALERTS POLICIES =====
-- Users can read their own alerts
CREATE POLICY "Users can read own alerts"
  ON bank_alerts
  FOR SELECT
  USING (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text) OR
         (SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Users can delete their own alerts
CREATE POLICY "Users can delete own alerts"
  ON bank_alerts
  FOR DELETE
  USING (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text));

-- ===== ADMIN ONLY TABLES =====
-- Only admins can access admin_actions
CREATE POLICY "Only admins can read admin_actions"
  ON bank_admin_actions
  FOR SELECT
  USING ((SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Only admins can insert admin_actions
CREATE POLICY "Only admins can create admin_actions"
  ON bank_admin_actions
  FOR INSERT
  WITH CHECK ((SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Only admins can access support_tickets
CREATE POLICY "Only admins can manage support_tickets"
  ON bank_support_tickets
  FOR ALL
  USING ((SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- ===== MESSAGES POLICIES =====
-- Users can read their own messages
CREATE POLICY "Users can read own messages"
  ON bank_messages
  FOR SELECT
  USING (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text) OR
         (SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- Users can create their own messages
CREATE POLICY "Users can create own messages"
  ON bank_messages
  FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text));

-- ===== INVESTMENTS POLICIES =====
-- Users can read their own investments
CREATE POLICY "Users can read own investments"
  ON bank_investments
  FOR SELECT
  USING (user_id = (SELECT id FROM bank_users WHERE supabase_user_id = auth.uid()::text) OR
         (SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- ===== PENDING TRANSFERS POLICIES =====
-- Only admins can manage pending transfers
CREATE POLICY "Only admins can manage pending_transfers"
  ON bank_pending_transfers
  FOR ALL
  USING ((SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');

-- ===== REGISTRATIONS POLICIES =====
-- Only admins can manage registrations
CREATE POLICY "Only admins can manage registrations"
  ON bank_registrations
  FOR ALL
  USING ((SELECT app_metadata->>'role' FROM auth.users WHERE id = auth.uid()) = 'admin');
