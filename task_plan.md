# World Bank App — Architecture Reference
## Last Updated: 2026-07-09

## Stack
- **Frontend**: React 18 + Vite 5 + Wouter + TanStack Query v5 + shadcn/ui + Tailwind
- **Backend**: Node.js + Express 4 (dev: `tsx server/index.ts`, prod: Vercel serverless)
- **Database**: Supabase Postgres (REST via @supabase/supabase-js service role key)
- **Auth**: Supabase Auth JWT — verified server-side in auth-middleware.ts
- **Realtime**: Supabase Realtime channels (client/src/hooks/)
- **Chat**: Supabase Realtime + messages table (server/supabase-live-chat.ts)

## Shared Folder Pattern
`shared/` is imported by BOTH client and server:
- Client: `@shared/*` → `../shared/*` (vite alias + client/tsconfig.json)
- Server: `@shared/*` → `./shared/*` (root tsconfig.json + tsconfig.server.json)

### shared/schema.ts
Drizzle schema + Zod validators + ALL canonical TypeScript types.
Exports: `User`, `Account`, `Transaction`, `SupportTicket`, `Card`, `Investment`,
`Message`, `Alert`, `AdminAction`, plus Insert variants and Drizzle row types.

### shared/types.ts
Additional shared types: `AuthUser`, `SessionToken`, `StoredProfile`,
`ApiSuccess`, `ApiError`, `RealtimeBalanceUpdate`, `ROLE_PERMISSIONS`,
`hasPermission`, `isAdminRole`, `isStaffRole`.

## Real Database Tables (verified 2026-07-09)

### user_profiles (PRIMARY USER TABLE)
id: uuid PK (= auth.uid(), set by trigger)
email, username, role ('customer'|'admin'|'support'|'compliance')
is_active: boolean, is_verified: boolean
balance: numeric, account_number: text, transfer_pin: text (bcrypt hashed)
full_name, first_name, last_name: text
phone_number, occupation, profession: text
date_of_birth, city, state, country, postal_code: text
identification_type, identification_number: text
kyc_status: text, account_type: text
created_at, updated_at: timestamptz

### bank_accounts
id: uuid PK, user_id: uuid FK
account_number: text NOT NULL, account_type: text NOT NULL
balance: numeric, available_balance: numeric
currency: text default 'USD', status: text default 'active'
routing_number, iban, swift_code, account_nickname: text
is_primary: boolean
created_at, updated_at: timestamptz

### transactions
id: uuid PK
from_account_id, to_account_id, from_user_id: uuid
amount: numeric NOT NULL, currency: text NOT NULL
transaction_type: text NOT NULL  (NOT 'type')
reference_number: text NOT NULL
status: text default 'pending'
description, recipient_name, recipient_account,
recipient_country, bank_name, swift_code, transfer_purpose: text
requires_approval: boolean, approved_by: uuid, approved_at: timestamptz
created_at, processed_at, completed_at: timestamptz

### wb_users (minimal auth gate)
id: uuid PK (= auth.uid())
email: text NOT NULL UNIQUE
role: text NOT NULL default 'customer'
kyc_status: text, account_status: text
transfer_pin_hash: text
last_login_at, locked_until: timestamptz
failed_login_attempts: integer

### Other tables (all UUID PKs)
alerts, messages, cards, investments, support_tickets, admin_actions
user_profiles table (above)
wb_audit_logs, wb_messages, wb_notifications, wb_security_events, wb_system_events
wb_profiles, wb_accounts, wb_transactions, transaction_approvals

## Auth Flow
1. POST /api/auth/login → supabaseAdmin.auth.signInWithPassword()
2. Returns { token (JWT), refreshToken, user (from user_profiles) }
3. Client stores token in localStorage('token')
4. All API calls: Authorization: Bearer <token>
5. requireAuth: verifies JWT via supabase.auth.getUser(token) server-side
6. Looks up user_profiles by email
7. Auto-creates user_profiles row if missing (sync from Supabase Auth metadata)
8. Attaches req.user = { id (UUID), email, role }
9. requireAdmin: additionally checks role === 'admin'

## TypeScript Config
- tsconfig.json: root, noEmit:true, covers all files
- tsconfig.server.json: server build, emits to dist/server/, CommonJS
- client/tsconfig.json: client only, jsx:react-jsx
- All three have @shared/* path alias

## Build Scripts
| npm run dev          | tsx server/index.ts (dev) |
| npm run build        | vite build → dist/public/ |
| npm run build:server | tsc -p tsconfig.server.json → dist/server/ |
| npm run build:all    | build + build:server |
| npm run check        | type-check all files |
| npm run check:server | type-check server only |
| npm start            | node dist/server/index.js |

## Role-Based Access
Roles: customer, admin, support, compliance
- customer: read/write own data, transfer own funds
- support: read all users, read all tickets
- compliance: read all, write transactions
- admin: full access
Middleware: requireAuth (all authenticated routes), requireAdmin (admin-only routes)
