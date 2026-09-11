# Database Setup Guide

## Overview

This World Bank application uses **PostgreSQL** via Supabase with row-level security (RLS) policies to protect user data.

## Prerequisites

- Supabase account (https://supabase.com)
- PostgreSQL database provisioned in Supabase
- Environment variables configured:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (backend only)
  - `SUPABASE_DATABASE_URL` - Direct PostgreSQL connection string

## Database Schema

The application uses Drizzle ORM for type-safe schema management. Schema is defined in:
- `shared/schema.ts` - Core tables and validation schemas

### Key Tables

1. **bank_users** - User profiles
2. **bank_accounts** - User accounts with balances
3. **transactions** - All financial transactions
4. **admin_actions** - Audit trail for admin operations
5. **support_tickets** - Customer support system
6. **cards** - Payment cards
7. **investments** - Investment products
8. **messages** - Chat/messaging system
9. **alerts** - User notifications

## Setup Instructions

### Step 1: Initialize Database

```bash
# Install dependencies
npm install

# Generate and run migrations
npm run db:push
```

### Step 2: Enable Row-Level Security (RLS)

Run the RLS policy scripts in Supabase SQL Editor:

```bash
# Execute the RLS policies file
# SQL policies are in: sql/rls-policies.sql or server/RLS-POLICIES.sql
```

**Critical:** RLS must be enabled to protect user data:

```sql
-- Example: Enable RLS on bank_users table
ALTER TABLE bank_users ENABLE ROW LEVEL SECURITY;

-- Example: Policy for users to read their own profile
CREATE POLICY "Users can read own profile"
  ON bank_users FOR SELECT
  USING (id = auth.uid()::int OR auth.jwt() ->> 'role' = 'admin');
```

### Step 3: Verify Setup

Run startup checks:

```bash
npm run dev
```

The application will verify:
- ✅ Database connectivity
- ✅ Required tables exist
- ✅ RLS policies are enabled
- ✅ Service role key is valid

## Error Handling

### Missing Environment Variables

**Error:** `Missing Supabase environment variables`

**Fix:** Set environment variables in `.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DATABASE_URL=postgresql://...
```

### RLS Policy Errors

**Error:** `permission denied for schema public`

**Fix:** Ensure RLS policies are configured correctly. Run:

```bash
# In Supabase SQL Editor, verify policies exist:
SELECT * FROM pg_policies WHERE tablename = 'bank_users';
```

### Atomic Operations Failures

**Error:** `function atomic_balance_update does not exist`

**Fix:** Create the atomic balance update function:

```sql
CREATE OR REPLACE FUNCTION atomic_balance_update(
  p_account_id INTEGER,
  p_amount_change DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  v_new_balance DECIMAL;
BEGIN
  UPDATE bank_accounts
  SET balance = balance + p_amount_change,
      updated_at = NOW()
  WHERE id = p_account_id
  RETURNING balance INTO v_new_balance;
  
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql;
```

## Security Best Practices

1. **Row-Level Security (RLS)**
   - Always enable RLS on sensitive tables
   - Create policies for read, insert, update operations
   - Test policies before deployment

2. **Authentication**
   - Use Supabase Auth for user management
   - Store JWTs securely (HttpOnly cookies recommended)
   - Validate JWTs server-side before accessing data

3. **Authorization**
   - Use `app_metadata.role` in Supabase Auth for role-based access
   - Server enforces roles, don't trust client-side roles
   - Admins are managed via Supabase dashboard

4. **Data Protection**
   - Transfer PINs are hashed with bcrypt
   - Sensitive data is never logged
   - All API responses filtered to user's data only

5. **SQL Injection Prevention**
   - Use Drizzle ORM query builder (never string concat)
   - Always use parameterized queries
   - Validate input with Zod schemas

## Monitoring

Check database health:

```bash
# View recent transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 100;

# Monitor storage usage
SELECT pg_size_pretty(pg_database_size(current_database()));

# Check slow queries
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## Troubleshooting

### Connection Issues

**Error:** `ECONNREFUSED 127.0.0.1:5432`

**Fix:** Ensure Supabase database is running and connection string is correct.

### Migration Issues

**Error:** `error: relation "bank_users" already exists`

**Fix:** Migrations have already been applied. To reset:

```bash
# WARNING: This deletes all data
SUPABASE_DATABASE_URL=... npm run db:push -- --force
```

## Next Steps

- Review `shared/schema.ts` for table definitions
- Check `sql/rls-policies.sql` for security policies
- Test RLS policies with sample data
- Enable Supabase backups for production
- Configure Supabase audit logs for compliance
