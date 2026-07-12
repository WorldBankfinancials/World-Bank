/*
# Remove all wb_ prefixed legacy tables and transaction_approvals

## What This Does
1. Drops 9 legacy `wb_` prefixed tables that are empty and unused by the application
2. Drops `transaction_approvals` table (also empty, unused)
3. These tables were created by an earlier migration but the application was refactored
   to use non-prefixed table names (user_profiles, bank_accounts, transactions, etc.)

## Tables Being Dropped (all confirmed 0 rows)
- wb_users (0 rows) — replaced by user_profiles
- wb_profiles (0 rows) — replaced by user_profiles  
- wb_accounts (0 rows) — replaced by bank_accounts
- wb_transactions (0 rows) — replaced by transactions
- wb_audit_logs (0 rows) — replaced by admin_actions
- wb_messages (0 rows) — replaced by messages
- wb_notifications (0 rows) — replaced by alerts
- wb_security_events (0 rows) — no replacement needed
- wb_system_events (0 rows) — no replacement needed
- transaction_approvals (0 rows) — approval logic moved to transactions.status

## Safety
- All tables confirmed to have 0 rows before dropping
- No data loss possible
- Application code does not reference any of these tables
*/

DROP TABLE IF EXISTS wb_users CASCADE;
DROP TABLE IF EXISTS wb_profiles CASCADE;
DROP TABLE IF EXISTS wb_accounts CASCADE;
DROP TABLE IF EXISTS wb_transactions CASCADE;
DROP TABLE IF EXISTS wb_audit_logs CASCADE;
DROP TABLE IF EXISTS wb_messages CASCADE;
DROP TABLE IF EXISTS wb_notifications CASCADE;
DROP TABLE IF EXISTS wb_security_events CASCADE;
DROP TABLE IF EXISTS wb_system_events CASCADE;
DROP TABLE IF EXISTS transaction_approvals CASCADE;
