# RLS Policy Setup Guide for World Bank Application

## ⚠️ CRITICAL: RLS Policies Must Be Applied Manually

**Status**: RLS is ENABLED on all tables, but **NO POLICIES are currently applied**.

This means:
- ✅ Tables are protected by RLS
- ❌ **NO access policies exist** - all user queries will fail!
- ❌ Only service_role (backend) can access data

## Quick Start: Apply RLS Policies Now

### Method 1: Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar
4. Click "New query"
5. Copy the ENTIRE contents of `supabase-rls-policies.sql`
6. Paste into the SQL Editor
7. Click "Run" button
8. Wait for all statements to execute (should take ~10-30 seconds)
9. Verify: You should see "Success" messages

### Method 2: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push

# Or execute the SQL file directly
supabase db execute --file ./supabase-rls-policies.sql
```

### Method 3: PostgreSQL Client (psql)

```bash
psql $DATABASE_URL -f supabase-rls-policies.sql
```

## Verification

After applying policies, verify they exist:

```sql
-- Check RLS is enabled (should show 't' for all tables)
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Count policies (should show ~40+ policies)
SELECT COUNT(*) as policy_count 
FROM pg_policies 
WHERE schemaname = 'public';

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;
```

## What RLS Policies Do

The RLS policies enforce:

1. **Data Isolation**: Users can ONLY see their own data
2. **Role-Based Access**: 
   - `authenticated` users: Read/write own data
   - `service_role` (backend): Full access to all data
3. **Security**: Prevents data leaks between users

## Tables Protected by RLS

All 15 tables are protected:
- bank_users
- bank_accounts  
- transactions
- cards
- investments
- messages
- alerts
- support_tickets
- admin_actions
- documents
- branches (public read)
- atms (public read)
- exchange_rates (public read)
- market_rates (public read)
- statements

## Policy Types

### Private Tables (User-Specific Data)
- bank_users, bank_accounts, transactions, cards, investments
- messages, alerts, support_tickets, documents, statements
- Policy: Users can ONLY access their own records

### Public Read Tables
- branches, atms, exchange_rates, market_rates
- Policy: All authenticated users can read, only backend can write

### Admin Only Tables
- admin_actions
- Policy: Only backend (service_role) can access

## Common Issues

### Issue 1: "No rows returned" after applying policies
**Solution**: Make sure your user has `supabase_user_id` set in `bank_users` table:
```sql
SELECT id, email, supabase_user_id FROM bank_users;
-- If supabase_user_id is NULL, update it:
UPDATE bank_users SET supabase_user_id = '<your-auth-uid>' WHERE email = 'your@email.com';
```

### Issue 2: "permission denied for table X"
**Solution**: RLS is enabled but policies not applied. Run the SQL file above.

### Issue 3: "Could not find table in schema cache"
**Solution**: This is a warning that appears during startup. Tables exist, but Supabase schema cache needs refresh. It will resolve automatically.

## Development vs Production

### Development (Current Setup)
- Backend uses `service_role` key - bypasses RLS
- Frontend uses `anon` or `authenticated` role - respects RLS
- This allows testing both paths

### Production
- **CRITICAL**: Never expose `service_role` key to frontend
- Only backend should use `service_role`
- All frontend requests use `authenticated` role via JWT

## Monitoring

After applying policies, you can monitor access:

```sql
-- Check which users are accessing data
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as operation
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

## Next Steps

1. ✅ Apply RLS policies using Method 1 above
2. ✅ Verify policies exist (run verification SQL)
3. ✅ Test user login and data access
4. ✅ Confirm users can only see their own data
5. ✅ Deploy to production with confidence

## Support

If policies fail to apply:
1. Check Supabase dashboard for error messages
2. Verify you have sufficient permissions
3. Try applying policies one table at a time
4. Contact Supabase support if issues persist

---

**Last Updated**: October 30, 2025
**Status**: RLS enabled, policies ready to apply
**Next Action**: Run `supabase-rls-policies.sql` in Supabase SQL Editor
