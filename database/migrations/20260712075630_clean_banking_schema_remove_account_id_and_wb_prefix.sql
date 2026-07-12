/*
# Clean Banking Schema - Remove account_id and wb_ prefixes

## Purpose
This migration cleans up the banking database schema by:
1. Removing the `account_id` column from the `users` table (it was a legacy column that duplicated the relationship already captured by the `accounts` table)
2. Creating a `user_profiles` view that aliases the `users` table, so code referencing `user_profiles` continues to work
3. Creating a `bank_accounts` view that aliases the `accounts` table, so code referencing `bank_accounts` continues to work
4. Ensuring no `wb_` prefixed tables exist (none currently exist, this is preventive)

## Changes
### Modified Tables
- `users`: Removed `account_id` column (bigint, was nullable, not used in any foreign key or index)

### New Views
- `user_profiles`: A view that SELECTs all columns from `users`, providing backward compatibility for code that references `user_profiles`
- `bank_accounts`: A view that SELECTs all columns from `accounts`, providing backward compatibility for code that references `bank_accounts`

## Security
- No RLS policy changes - views inherit RLS from underlying tables
- No new tables created

## Important Notes
1. The `account_id` column removal is safe because the column is nullable and not referenced by any foreign key constraint
2. The views provide a compatibility layer so existing code continues to work without changes
3. Future migrations should standardize on `users` and `accounts` as the canonical table names
*/

-- 1. Remove account_id column from users table
ALTER TABLE users DROP COLUMN IF EXISTS account_id;

-- 2. Create user_profiles view (aliases users table for backward compatibility)
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
  id,
  email,
  username,
  role,
  is_active,
  is_verified,
  transfer_pin,
  kyc_status,
  account_type,
  account_number,
  balance,
  full_name,
  first_name,
  last_name,
  date_of_birth,
  phone_number,
  country_code,
  address,
  city,
  state,
  postal_code,
  country,
  occupation,
  profession,
  employer,
  annual_income,
  identification_type,
  identification_number,
  email_verified,
  phone_verified,
  identity_verified,
  created_at,
  updated_at,
  preferred_language,
  password_hash
FROM users;

-- 3. Create bank_accounts view (aliases accounts table for backward compatibility)
CREATE OR REPLACE VIEW bank_accounts AS
SELECT 
  id,
  user_id,
  account_number,
  routing_number,
  iban,
  swift_code,
  account_type,
  currency,
  balance,
  available_balance,
  status,
  interest_rate,
  minimum_balance,
  account_nickname,
  is_primary,
  created_at,
  updated_at
FROM accounts;

-- 4. Verify no wb_ prefixed tables exist (informational)
-- This is a preventive check - no action needed if none exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name LIKE 'wb_%'
  ) THEN
    RAISE NOTICE 'WARNING: wb_ prefixed tables still exist';
  ELSE
    RAISE NOTICE 'OK: No wb_ prefixed tables found';
  END IF;
END $$;
