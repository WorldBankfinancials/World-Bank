/*
# Add Missing Columns to user_profiles for Banking App Integration

## Summary
The server storage layer (supabase-public-storage.ts) expects columns on
user_profiles that don't exist in the current schema. This migration adds
the missing columns needed for the banking app to function properly.

## Changes to user_profiles
- email (text): User email for auth and communication
- username (text): Display username
- password_hash (text): bcrypt hash for server-side PIN/password verification
- account_number (text): Bank account number for display
- account_id (bigint): Legacy numeric account ID
- balance (numeric): Current account balance
- profession (text): User profession
- is_active (boolean): Account active/approved flag
- is_verified (boolean): Email/identity verified flag
- transfer_pin (text): bcrypt hash of 4-digit transfer PIN
- role (text): User role (customer/admin)

## Security
- transfer_pin stored as bcrypt hash, never plaintext
- password_hash stored as bcrypt hash
- role defaults to 'customer' for security
- is_active defaults to false (requires admin approval)
*/

ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS username text,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS account_id bigint,
  ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS profession text DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS transfer_pin text,
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'customer' CHECK (role = ANY (ARRAY['customer', 'admin']));

-- Create index on email for auth lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);