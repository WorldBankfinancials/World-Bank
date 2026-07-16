-- Add updated_at triggers for tables that are missing them
-- Tables: accounts, alerts, admin_actions, forex, kyc, messages

-- Reuse the existing update_updated_at_column function

-- accounts: has set_account_defaults_trigger on INSERT/UPDATE but no dedicated updated_at trigger
DROP TRIGGER IF EXISTS trigger_accounts_updated_at ON accounts;
CREATE TRIGGER trigger_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- alerts: no updated_at trigger
DROP TRIGGER IF EXISTS trigger_alerts_updated_at ON alerts;
CREATE TRIGGER trigger_alerts_updated_at
  BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- admin_actions: no updated_at trigger
DROP TRIGGER IF EXISTS trigger_admin_actions_updated_at ON admin_actions;
CREATE TRIGGER trigger_admin_actions_updated_at
  BEFORE UPDATE ON admin_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- forex: no updated_at trigger
DROP TRIGGER IF EXISTS trigger_forex_updated_at ON forex;
CREATE TRIGGER trigger_forex_updated_at
  BEFORE UPDATE ON forex
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- kyc: no updated_at trigger
DROP TRIGGER IF EXISTS trigger_kyc_updated_at ON kyc;
CREATE TRIGGER trigger_kyc_updated_at
  BEFORE UPDATE ON kyc
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- messages: no updated_at trigger
DROP TRIGGER IF EXISTS trigger_messages_updated_at ON messages;
CREATE TRIGGER trigger_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
