/*
# Add Missing Transfer Columns to transactions Table

## Summary
The server storage layer (routes-transfer.ts) writes transfer metadata
to the transactions table, but several columns are missing. This migration
adds the columns needed for domestic and international transfers.

## Changes to transactions
- from_user_id (uuid): The user who initiated the transfer
- recipient_name (text): Name of the transfer recipient
- recipient_account (text): Recipient's account number
- recipient_country (text): Recipient's country (for international transfers)
- bank_name (text): Recipient's bank name
- swift_code (text): SWIFT/BIC code for international transfers
- account_number (text): Recipient account number (alternative field)
- transfer_purpose (text): Purpose of the transfer

## Security
- No RLS policy changes needed — existing policies cover these new columns
- from_user_id is nullable for backward compatibility with existing rows
*/

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS from_user_id uuid,
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS recipient_account text,
  ADD COLUMN IF NOT EXISTS recipient_country text,
  ADD COLUMN IF NOT EXISTS bank_name text,
  ADD COLUMN IF NOT EXISTS swift_code text,
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS transfer_purpose text;

-- Index for querying user's transactions
CREATE INDEX IF NOT EXISTS idx_transactions_from_user ON transactions(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);