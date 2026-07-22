-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR WORLD BANK
-- CRITICAL: Protect user data by role and ownership
-- NOTE: All IDs are UUIDs. Use auth.uid() directly (no ::int cast).
-- NOTE: This file is reference documentation. The live policies
--       are managed via Supabase migrations in supabase/migrations/.
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE forex ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE atms ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_contacts ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- USERS TABLE POLICIES
-- ================================================================

CREATE POLICY "users_select_own" ON users FOR SELECT
  TO authenticated USING (id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "users_delete_own" ON users FOR DELETE
  TO authenticated USING (id = auth.uid());

-- ================================================================
-- ACCOUNTS TABLE POLICIES
-- ================================================================

CREATE POLICY "accounts_select_own" ON accounts FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "accounts_insert_own" ON accounts FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "accounts_update_own" ON accounts FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "accounts_delete_own" ON accounts FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ================================================================
-- TRANSACTIONS TABLE POLICIES
-- ================================================================

CREATE POLICY "transactions_select_own" ON transactions FOR SELECT
  TO authenticated USING (
    from_user_id = auth.uid() OR to_user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "transactions_insert_own" ON transactions FOR INSERT
  TO authenticated WITH CHECK (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "transactions_update_admin" ON transactions FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "transactions_delete_admin" ON transactions FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- ================================================================
-- CARDS TABLE POLICIES
-- ================================================================

CREATE POLICY "cards_select_own" ON cards FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "cards_insert_own" ON cards FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "cards_update_own" ON cards FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "cards_delete_own" ON cards FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ================================================================
-- INVESTMENTS TABLE POLICIES
-- ================================================================

CREATE POLICY "investments_select_own" ON investments FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "investments_insert_own" ON investments FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "investments_update_own" ON investments FOR UPDATE
  TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "investments_delete_own" ON investments FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ================================================================
-- MESSAGES TABLE POLICIES
-- ================================================================

CREATE POLICY "messages_select_own" ON messages FOR SELECT
  TO authenticated USING (
    sender_id = auth.uid() OR recipient_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "messages_insert_own" ON messages FOR INSERT
  TO authenticated WITH CHECK (sender_id = auth.uid());

CREATE POLICY "messages_update_own" ON messages FOR UPDATE
  TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY "messages_delete_own" ON messages FOR DELETE
  TO authenticated USING (sender_id = auth.uid() OR recipient_id = auth.uid());

-- ================================================================
-- ALERTS TABLE POLICIES
-- ================================================================

CREATE POLICY "alerts_select_own" ON alerts FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "alerts_insert_own" ON alerts FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "alerts_update_own" ON alerts FOR UPDATE
  TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "alerts_delete_own" ON alerts FOR DELETE
  TO authenticated USING (user_id = auth.uid());

-- ================================================================
-- SUPPORT_TICKETS TABLE POLICIES
-- ================================================================

CREATE POLICY "tickets_select_own" ON support_tickets FOR SELECT
  TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "tickets_insert_own" ON support_tickets FOR INSERT
  TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "tickets_update_admin" ON support_tickets FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "tickets_delete_own" ON support_tickets FOR DELETE
  TO authenticated USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

-- ================================================================
-- ADMIN_ACTIONS TABLE POLICIES
-- ================================================================

CREATE POLICY "admin_actions_select_admin" ON admin_actions FOR SELECT
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "admin_actions_insert_admin" ON admin_actions FOR INSERT
  TO authenticated WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "admin_actions_update_admin" ON admin_actions FOR UPDATE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));

CREATE POLICY "admin_actions_delete_admin" ON admin_actions FOR DELETE
  TO authenticated USING (EXISTS (
    SELECT 1 FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
  ));
