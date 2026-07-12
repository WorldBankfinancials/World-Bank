-- Fix admin_actions RLS: check role column (not account_type)
-- The application sets role = 'admin' but RLS was checking account_type = 'admin'

-- Drop existing admin_actions policies
DROP POLICY IF EXISTS "Admins can view admin actions" ON admin_actions;
DROP POLICY IF EXISTS "Admins can insert admin actions" ON admin_actions;

-- Recreate with correct column check
CREATE POLICY "Admins can view admin actions" ON admin_actions
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  ));

CREATE POLICY "Admins can insert admin actions" ON admin_actions
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.id = auth.uid() AND user_profiles.role = 'admin'
  ));

-- Fix alerts RLS: change FROM public TO authenticated
DROP POLICY IF EXISTS "Users can view own alerts" ON alerts;
DROP POLICY IF EXISTS "Users can update own alerts" ON alerts;

CREATE POLICY "Users can view own alerts" ON alerts
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON alerts
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
