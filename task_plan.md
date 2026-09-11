# World Bank App — Architecture Reference
## Last Updated: 2026-07-09 | Branch: main | Commit: 5455324

## Stack
- **Frontend**: React 18 + Vite 5 + Wouter + TanStack Query v5 + shadcn/ui + Tailwind
- **Backend**: Node.js + Express 4 (dev: `tsx server/index.ts`, prod: Vercel serverless)
- **Database**: Supabase Postgres (REST via @supabase/supabase-js service role key)
- **Auth**: Supabase Auth JWT — verified server-side in server/auth-middleware.ts
- **Realtime**: Supabase Realtime channels (client/src/hooks/)
- **Chat**: Supabase Realtime + messages table + WebSocket (server/supabase-live-chat.ts)

## Shared Folder Pattern
`shared/` is imported by BOTH client and server:
- Client: `@shared/*` → `../shared/*` (vite.config.ts alias + client/tsconfig.json)
- Server: `@shared/*` → `./shared/*` (root tsconfig.json + tsconfig.server.json)

### shared/schema.ts — exports (verified, no duplicates):
- Drizzle table definitions: `userProfiles`, `authUsers`, `bankAccounts`, `transactions`,
  `adminActions`, `supportTickets`, `cards`, `investments`, `messages`, `alerts`
- Drizzle Row types: `UserProfileRow`, `BankAccountRow`, `TransactionRow`, etc.
- Drizzle insert schemas: `insertUserProfileSchema`, `insertBankAccountSchema`, etc.
- Zod validation schemas: `transferPinSchema`, `transferSchema`, `verifyPinSchema`,
  `transferFormSchema`
- Zod types: `TransferForm`, `TransferPinInput`, `TransferInput`, `VerifyPinInput`
- Canonical TypeScript interfaces: `User`, `InsertUser`, `Account`, `InsertAccount`,
  `Transaction`, `InsertTransaction`, `SupportTicket`, `InsertSupportTicket`,
  `Card`, `InsertCard`, `Investment`, `InsertInvestment`, `Message`, `InsertMessage`,
  `Alert`, `InsertAlert`, `AdminAction`, `InsertAdminAction`
- Constants: `USER_ROLES`, `UserRole`, `TRANSACTION_TYPES`, `TransactionType`,
  `ACCOUNT_STATUSES`, `TRANSACTION_STATUSES`

### shared/types.ts — exports:
- `AuthUser` (req.user type in Express routes)
- `SessionToken`, `StoredProfile` (localStorage)
- `ApiSuccess`, `ApiError`, `ApiResponse`
- `RealtimeBalanceUpdate`, `RealtimeChatMessage`, `RealtimeTransactionUpdate`
- `ROLE_PERMISSIONS`, `hasPermission`, `isAdminRole`, `isStaffRole`

## Real Database Tables (Supabase Postgres)

### user_profiles (PRIMARY USER TABLE)
id: uuid PK (= auth.uid(), set by trigger)
email, username, role ('customer'|'admin'|'support'|'compliance')
is_active, is_verified: boolean
balance: numeric, account_number: text, transfer_pin: text (bcrypt hashed)
full_name, first_name, last_name: text
phone_number, occupation, profession: text
date_of_birth, city, state, country, postal_code: text
identification_type, identification_number, kyc_status, account_type: text
created_at, updated_at: timestamptz

### bank_accounts
id: uuid PK, user_id: uuid FK
account_number: text NOT NULL, account_type: text NOT NULL
balance, available_balance: numeric
currency: 'USD', status: 'active'
routing_number, iban, swift_code, account_nickname: text
is_primary: boolean

### transactions
id: uuid PK
from_account_id, to_account_id, from_user_id: uuid
amount: numeric NOT NULL, currency: text NOT NULL
transaction_type: text NOT NULL  ← NOTE: NOT 'type'
reference_number: text NOT NULL
status: 'pending', 'processing', 'completed', 'failed'
description, recipient_name, recipient_account, recipient_country,
bank_name, swift_code, transfer_purpose: text
requires_approval: boolean, approved_by: uuid
created_at, processed_at, completed_at: timestamptz

### wb_users (minimal auth gate, secondary)
id: uuid PK (= auth.uid())
email: text NOT NULL UNIQUE
role: 'customer'|'admin'|'support'|'compliance'
kyc_status, account_status: text
transfer_pin_hash: text
last_login_at, locked_until: timestamptz
failed_login_attempts: integer

### Other tables (all UUID PKs)
alerts, messages, cards, investments, support_tickets, admin_actions
wb_audit_logs, wb_messages, wb_notifications, wb_security_events
wb_system_events, wb_profiles, wb_accounts, wb_transactions
transaction_approvals

## Auth Flow
1. POST /api/auth/login → supabaseAdmin.auth.signInWithPassword()
2. Returns { token (Supabase JWT), refreshToken, user (from user_profiles) }
3. Client stores token in localStorage('token')
4. All API calls: Authorization: Bearer <token>
5. requireAuth: verifies JWT via supabase.auth.getUser(token) server-side
6. Looks up user_profiles by email
7. Auto-creates user_profiles row if missing
8. req.user = { id (UUID string), email, role }
9. requireAdmin: checks role === 'admin'

## Build Scripts
npm run dev          → tsx server/index.ts
npm run build        → vite build → dist/public/
npm run build:server → tsc -p tsconfig.server.json → dist/server/
npm run build:all    → build + build:server
npm run check        → type-check all
npm run check:server → type-check server only
npm start            → node dist/server/index.js (after build:all)

## Vercel Build (IMPORTANT)
- vercel.json buildCommand: "npm run build" (vite build ONLY)
- outputDirectory: dist/public
- Client compiles via vite build → dist/public/
- API functions in api/**/*.ts compiled by Vercel's own TypeScript compiler
- build:server (tsc) is NOT run during Vercel build — legacy server files have
  number→string UUID type mismatches that would fail tsc but don't affect
  the runtime since Vercel uses tsx-like transpilation for api/ functions

## Vercel Deployment Troubleshooting
If Vercel builds an old commit (not latest main):
- Redeploying from Vercel dashboard redeploys the SAME commit, not latest main
- Must create a NEW deployment from the Vercel dashboard or push a new commit
- Check the "Commit" field in the Vercel build log to verify which commit is built

## TypeScript Configs
- tsconfig.json: root, noEmit:true, @shared/* → ./shared/*
- tsconfig.server.json: server build, emits to dist/server/, CommonJS
  Excludes legacy files: supabase-storage.ts, supabase-storage-complete.ts,
  postgres-storage.ts, hybrid-postgres-storage.ts, unified-sync-storage.ts,
  objectStorage.ts, transfer-approval.ts, user-creation.ts, supabase-mapping.ts,
  vite.ts, vite.config.ts
- client/tsconfig.json: jsx:react-jsx, @shared/* → ../shared/*

## Realtime Subscriptions
- useRealtimeAlerts: alerts table, filter user_id=eq.{userId} (userId: string UUID)
- useRealtimeChat: messages table, filter recipient_id=eq.{userId}
- supabase-live-chat.ts: server WebSocket + Supabase channel for messages

## Key Server Files
server/index.ts             — Express app, WebSocket, Vite dev
server/fix-routes.ts        — All API endpoints
server/routes-transfer.ts   — Transfer endpoints
server/auth-middleware.ts   — JWT verification + user_profiles lookup
server/storage.ts           — IStorage interface
server/supabase-public-storage.ts — Supabase REST implementation (PRODUCTION)
server/storage-factory.ts   — Singleton storage
server/validation-schemas.ts — Zod validators
server/validators.ts        — Low-level validators
api/index.ts                — Vercel serverless entry

## Production Import Chain (Vercel)
api/index.ts → server/fix-routes.ts → server/storage-factory.ts
  → server/supabase-public-storage.ts (only storage impl in prod)
  → server/auth-middleware.ts, server/routes-transfer.ts, server/validators.ts
  → shared/schema.ts, shared/types.ts
