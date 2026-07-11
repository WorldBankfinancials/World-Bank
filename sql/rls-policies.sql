-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR WORLD BANK
-- CRITICAL: Protect user data by role and ownership
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE bank_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- BANK_USERS TABLE POLICIES
-- ================================================================

-- Customers can only view their own profile
CREATE POLICY "Users can view own profile"
  ON bank_users FOR SELECT
  USING (id = auth.uid()::int OR auth.jwt() ->> 'role' = 'admin');

-- Only admins can update user profiles
CREATE POLICY "Admins can update users"
  ON bank_users FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Service role can create users during registration
CREATE POLICY "Service role can create users"
  ON bank_users FOR INSERT
  WITH CHECK (true);

-- ================================================================
-- BANK_ACCOUNTS TABLE POLICIES
-- ================================================================

-- Users can only view their own accounts
CREATE POLICY "Users can view own accounts"
  ON bank_accounts FOR SELECT
  USING (user_id = auth.uid()::int OR auth.jwt() ->> 'role' = 'admin');

-- Users can only update their own accounts (limited fields)
CREATE POLICY "Users can update own accounts"
  ON bank_accounts FOR UPDATE
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int AND status IN ('active', 'frozen'));

-- Only admins can create new accounts
CREATE POLICY "Admins can create accounts"
  ON bank_accounts FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ================================================================
-- TRANSACTIONS TABLE POLICIES
-- ================================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (
    from_user_id = auth.uid()::int OR 
    to_user_id = auth.uid()::int OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins can update transaction status
CREATE POLICY "Admins can update transactions"
  ON transactions FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Service role can create transactions
CREATE POLICY "Service role can create transactions"
  ON transactions FOR INSERT
  WITH CHECK (true);

-- ================================================================
-- CARDS TABLE POLICIES
-- ================================================================

-- Users can only view their own cards
CREATE POLICY "Users can view own cards"
  ON cards FOR SELECT
  USING (user_id = auth.uid()::int OR auth.jwt() ->> 'role' = 'admin');

-- Users can update their own cards
CREATE POLICY "Users can update own cards"
  ON cards FOR UPDATE
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

-- ================================================================
-- INVESTMENTS TABLE POLICIES
-- ================================================================

-- Users can only view their own investments
CREATE POLICY "Users can view own investments"
  ON investments FOR SELECT
  USING (user_id = auth.uid()::int OR auth.jwt() ->> 'role' = 'admin');

-- Users can update their own investments
CREATE POLICY "Users can update own investments"
  ON investments FOR UPDATE
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

-- ================================================================
-- MESSAGES TABLE POLICIES
-- ================================================================

-- Users can only view messages they're part of
CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  USING (
    sender_id = auth.uid()::int OR 
    receiver_id = auth.uid()::int OR 
    auth.jwt() ->> 'role' = 'admin'
  );

-- Users can only create their own messages
CREATE POLICY "Users can create messages"
  ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid()::int);

-- ================================================================
-- ALERTS TABLE POLICIES
-- ================================================================

-- Users can only view their own alerts
CREATE POLICY "Users can view own alerts"
  ON alerts FOR SELECT
  USING (user_id = auth.uid()::int OR auth.jwt() ->> 'role' = 'admin');

-- Users can update their own alerts
CREATE POLICY "Users can update own alerts"
  ON alerts FOR UPDATE
  USING (user_id = auth.uid()::int)
  WITH CHECK (user_id = auth.uid()::int);

-- ================================================================
-- SUPPORT_TICKETS TABLE POLICIES
-- ================================================================

-- Users can view their own tickets
CREATE POLICY "Users can view own support tickets"
  ON support_tickets FOR SELECT
  USING (user_id = auth.uid()::int OR auth.jwt() ->> 'role' = 'admin');

-- Users can create their own tickets
CREATE POLICY "Users can create support tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (user_id = auth.uid()::int);

-- Admins can update tickets
CREATE POLICY "Admins can update support tickets"
  ON support_tickets FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- ================================================================
-- ADMIN_ACTIONS TABLE POLICIES
-- ================================================================

-- Only admins can view admin actions
CREATE POLICY "Admins can view admin actions"
  ON admin_actions FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Only admins can create admin actions
CREATE POLICY "Admins can create admin actions"
  ON admin_actions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');
