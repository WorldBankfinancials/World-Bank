
-- COMPREHENSIVE DATABASE VERIFICATION SCRIPT
-- Run this in Supabase SQL Editor to verify everything is set up correctly

-- 1. Check if all tables exist
SELECT 
  'bank_users' as table_name, 
  COUNT(*) as row_count 
FROM bank_users
UNION ALL
SELECT 'bank_accounts', COUNT(*) FROM bank_accounts
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'alerts', COUNT(*) FROM alerts
UNION ALL
SELECT 'beneficiaries', COUNT(*) FROM beneficiaries;

-- 2. Verify Wei Liu's data is loaded
SELECT 
  full_name,
  email,
  account_number,
  balance,
  is_active
FROM bank_users
WHERE email = 'vaa33053@gmail.com';

-- 3. Check RLS policies are enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('bank_users', 'bank_accounts', 'transactions', 'messages', 'alerts');

-- 4. List all active policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 5. Verify realtime is enabled
SELECT 
  relname as table_name,
  CASE 
    WHEN relreplident = 'd' THEN 'default'
    WHEN relreplident = 'n' THEN 'nothing'
    WHEN relreplident = 'f' THEN 'full'
    WHEN relreplident = 'i' THEN 'index'
  END as replica_identity
FROM pg_class
WHERE relnamespace = 'public'::regnamespace
  AND relname IN ('bank_users', 'bank_accounts', 'transactions', 'messages', 'alerts');

-- 6. Check indexes exist
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('bank_users', 'bank_accounts', 'transactions')
ORDER BY tablename, indexname;
