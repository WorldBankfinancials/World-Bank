# World Bank App — Task Plan & Architecture Reference

## Last Updated: 2026-07-09

## Architecture

### Stack
- **Frontend**: React 18 + Vite + Wouter + TanStack Query + shadcn/ui + Tailwind
- **Backend**: Node.js + Express (dev: tsx, prod: Vercel serverless via api/index.ts)
- **Database**: Supabase Postgres (REST API via @supabase/supabase-js service role)
- **Auth**: Supabase Auth (JWT) — verified server-side in auth-middleware.ts
- **Realtime**: Supabase Realtime channels (client hooks in client/src/hooks/)
- **Chat**: Supabase Realtime + messages table + WebSocket in dev (server/supabase-live-chat.ts)

### Shared Folder
- `shared/schema.ts` is imported by BOTH client and server
- Client imports via `@shared/*` alias → `../shared/*` (configured in client/tsconfig.json + vite.config.ts)
- Server imports via `@shared/*` alias → `./shared/*` (configured in root tsconfig.json + tsconfig.server.json)
- **Primary tables**: wb_users, wb_accounts, wb_transactions, wb_profiles
- **Legacy tables** (still active): bank_accounts, transactions, messages, alerts, cards, investments, support_tickets, admin_actions
- All primary key IDs are **UUID strings** (not integers)

### Key Files
| File | Purpose |
|------|---------|
| `shared/schema.ts` | Drizzle schema + Zod validators + User/Account/Transaction types |
| `server/storage.ts` | IStorage interface (all IDs: string UUID) |
| `server/supabase-public-storage.ts` | Supabase REST implementation of IStorage |
| `server/storage-factory.ts` | Singleton IStorage instance |
| `server/auth-middleware.ts` | requireAuth + requireAdmin middleware |
| `server/fix-routes.ts` | All 78 API endpoints |
| `server/index.ts` | Dev server entry (tsx) |
| `api/index.ts` | Vercel serverless entry |
| `client/src/lib/supabase.ts` | Supabase client singleton |
| `client/src/lib/queryClient.ts` | React Query + authenticatedFetch |
| `client/src/contexts/AuthContext.tsx` | Auth state, calls /api/auth/login |

### TypeScript Config
- `tsconfig.json` — root, covers all files, noEmit:true
- `tsconfig.server.json` — server build only, emits to dist/server/, CommonJS
- `client/tsconfig.json` — client only, no tsconfig.node.json reference
- All configs have `@shared/*` path aliases pointing to `./shared/` or `../shared/`

### Build Scripts
| Script | Purpose |
|--------|---------|
| `npm run dev` | Dev server (tsx server/index.ts) |
| `npm run build` | Vite build → dist/public/ |
| `npm run build:server` | tsc -p tsconfig.server.json → dist/server/ |
| `npm run build:all` | Frontend + server build |
| `npm run check` | Type check all files |
| `npm run check:server` | Type check server only |
| `npm start` | node dist/server/index.js (after build:all) |

## Database Schema (Supabase)

### Primary Tables (wb_*)
#### wb_users
- id: uuid PK (= auth.uid())
- email: text unique NOT NULL
- role: text ('customer' | 'admin' | 'support' | 'compliance')
- status: text ('pending' | 'active' | 'suspended' | 'closed')
- is_active: boolean
- is_verified: boolean
- balance: numeric(18,2)
- transfer_pin: text (bcrypt hashed)
- account_number: text
- first_name, last_name, full_name: text
- phone_number: text
- occupation: text
- avatar_url: text
- last_login: timestamptz
- created_at, updated_at: timestamptz

#### wb_accounts
- id: uuid PK
- user_id: uuid FK → auth.users
- account_number: text unique
- account_type: text ('checking' | 'savings' | 'investment')
- balance: numeric(18,2)
- currency: text default 'USD'
- status: text ('active' | 'frozen' | 'closed' | 'pending')

#### wb_transactions
- id: uuid PK
- user_id: uuid FK → wb_users
- from_account_id, to_account_id: uuid
- type, status, amount, currency, description, reference_number: text/numeric

#### wb_profiles
- Extended KYC data linked to wb_users.id

### Legacy Tables (still active)
- bank_accounts — used for account balances in storage layer
- transactions — used for all transaction writes
- messages — chat messages
- alerts — user notifications
- cards, investments, support_tickets, admin_actions

### RLS Summary
- All wb_* tables have RLS enabled
- Users: SELECT/UPDATE own rows via auth.uid() = id
- Admins: SELECT/UPDATE all rows via role check in wb_users
- Admin actions table: admin-only INSERT/SELECT

## Auth Flow
1. User POSTs to /api/auth/login with email + password
2. Server calls supabaseAdmin.auth.signInWithPassword()
3. Server gets Supabase JWT access_token
4. Server syncs/creates wb_users row for the user
5. Server returns { token, refreshToken, user } to client
6. Client stores token in localStorage
7. All API calls include Authorization: Bearer <token>
8. requireAuth middleware verifies JWT via supabase.auth.getUser(token)
9. Attaches req.user = { id (UUID), email, role } to request
10. requireAdmin additionally checks role === 'admin'

## Session / Token Flow
- Token: Supabase JWT stored in localStorage as 'token'
- Refresh: localStorage 'refresh_token'
- queryClient.ts reads token from localStorage for all authenticated fetches
- On 401: localStorage cleared, redirect to /login
- Role-based routing: AdminRoute component checks AuthContext user.role

## Realtime Subscriptions (client hooks)
- useRealtimeAlerts.ts — alerts table changes
- useRealtimeChat.ts — messages table changes
- useRealtimeTransactions.ts — transactions table changes
- useSupabaseRealtimeDashboard.ts — dashboard aggregates
- usePresence.ts — user online status

## Completed Fixes (2026-07-09)
- [x] shared/schema.ts: UUID IDs, wb_users/wb_accounts/wb_transactions tables
- [x] server/storage.ts: IStorage interface uses string IDs throughout
- [x] server/supabase-public-storage.ts: queries wb_users, maps correct columns
- [x] server/auth-middleware.ts: uses wb_users, string UUIDs, clean sync
- [x] server/storage-factory.ts: clean singleton
- [x] tsconfig.json: fixed, @shared/* alias, jsx, strict
- [x] tsconfig.server.json: NEW — server build config, emits to dist/server/
- [x] client/tsconfig.json: removed missing tsconfig.node.json reference
- [x] package.json: added build:server, build:all, check:server scripts
- [x] api/index.ts: eager route registration, no race condition
- [x] server/vite.ts: safe for Vercel (no top-level vite import)
- [x] AuthContext.tsx: restored original /api/auth/login flow
