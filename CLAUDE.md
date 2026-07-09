# CLAUDE.md — World Bank Digital Banking Application
## Multi-Agent System Architecture & Behavioral Rules

### Project Identity
- **Name**: World Bank Digital Banking (Apex Banking Corporation)
- **Repository**: WorldBankfinancials/World-Bank (GitHub)
- **Platform**: Mobile-first web application (iPhone browser optimized)
- **Backend**: Supabase PostgreSQL (actively running, 10 tables, 37 RLS policies)
- **Hosting**: Vercel (production) with preview deployments

---

### File Architecture Map

```
project/
├── client/                    # React 18 + Vite frontend
│   ├── src/
│   │   ├── App.tsx           # Root component, wouter routing, provider stack
│   │   ├── main.tsx          # Entry point, error suppression setup
│   │   ├── pages/            # ~53 page components (banking, admin, transfers)
│   │   ├── components/       # 16 custom components + ui/ (shadcn/Radix)
│   │   ├── contexts/         # AuthContext (localStorage), LanguageContext (en/zh)
│   │   ├── hooks/            # Realtime, presence, user data, toast hooks
│   │   ├── lib/              # supabase.ts, api.ts, queryClient.ts, utils
│   │   ├── data/             # countries.ts
│   │   └── types/            # index.ts
│   ├── public/               # world-bank-logo.jpeg
│   └── tsconfig.json
├── server/                   # Express + TypeScript backend (34 files)
│   ├── index.ts              # Express bootstrap, process.env.PORT, WebSocket /ws/chat
│   ├── config.ts             # Data source selection (supabase/memory/mock)
│   ├── auth-middleware.ts    # JWT decode (NOT verify), user sync
│   ├── storage-factory.ts    # Hardcoded SupabasePublicStorage singleton
│   ├── supabase-public-storage.ts  # ACTIVE storage implementation (Supabase REST API)
│   ├── routes-transfer.ts    # Transfer API endpoints (PIN verified with bcrypt)
│   ├── fix-routes.ts         # Route registration (~78 endpoints)
│   ├── rate-limiter.ts       # Rate limiting middleware
│   ├── transaction-wrapper.ts # Atomic balance updates with rollback
│   ├── vite.ts               # Vite dev middleware + static serving
│   └── ...                   # 20+ server modules
├── shared/
│   └── schema.ts             # Drizzle ORM schema (10 tables, Zod schemas)
├── supabase/
│   └── migrations/
│       └── 001_banking_schema.sql  # UUID-based schema with RLS + triggers
├── sql/
│   └── rls-policies.sql      # RLS policies (conflicts with server/RLS-POLICIES.sql)
├── .github/workflows/        # CI (ci.yml, codeql.yml)
├── .vscode/                  # VS Code workspace settings
├── .claudecode/              # Claude Code OpenRouter bridge config
├── .husky/                   # Git hooks (pre-commit, pre-push, post-merge)
└── .env                      # Supabase credentials (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
```

### Active Database Connections

| Variable | Used By | Purpose |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Client (supabase.ts), Server (supabase-public-storage.ts, auth-middleware.ts) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client (supabase.ts) | Client-side Supabase access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (supabase-public-storage.ts, auth-middleware.ts) | Server-side privileged access (bypasses RLS) |
| `DATABASE_URL` | Server (dead storage implementations) | Direct PostgreSQL connection |
| `SUPABASE_DATABASE_URL` | Drizzle Kit (drizzle.config.ts) | Migration tooling |

### Production Port Map

| Service | Port | Environment Variable |
|---------|------|---------------------|
| Express API server | `process.env.PORT` (fallback 5000) | `PORT` env var |
| Vite dev server (client) | 5000 | Client vite.config.ts (proxies to API) |
| Vite dev server (root) | 5173 | Root vite.config.ts |
| WebSocket chat | `/ws/chat` | Attached to Express server |
| Vercel production | Dynamic | `process.env.PORT` (Vercel assigns) |

### Supabase Database Schema (Active — 10 tables, 37 RLS policies)

| Table | PK Type | RLS | Policies | Purpose |
|-------|---------|-----|----------|---------|
| `user_profiles` | UUID (FK auth.users) | Enabled | 4 (CRUD) | User accounts, KYC, auth |
| `bank_accounts` | UUID | Enabled | 4 (CRUD) | User bank accounts |
| `transactions` | UUID | Enabled | 3 (SELECT/INSERT/UPDATE) | Transfers and transactions |
| `cards` | UUID | Enabled | 4 (CRUD) | Debit/credit cards |
| `alerts` | UUID | Enabled | 4 (CRUD) | User notifications |
| `messages` | UUID | Enabled | 4 (CRUD) | Chat messages |
| `transaction_approvals` | UUID | Enabled | 3 (admin-only) | Admin approval workflow |
| `admin_actions` | UUID | Enabled | 2 (admin-only) | Admin action logging |
| `support_tickets` | UUID | Enabled | 5 (user + admin) | Support ticket system |
| `investments` | UUID | Enabled | 4 (CRUD) | Investment portfolio |

### Migrations Applied

1. `001_banking_schema.sql` — Original 7-table schema with UUID PKs, RLS, triggers
2. `002_fix_rls_policies_and_missing_tables` — Fixed RLS on all tables, added 3 new tables
3. `003_add_missing_user_profile_columns` — Added 11 columns to user_profiles
4. `004_add_transfer_columns` — Added 8 transfer metadata columns to transactions

### Known Architecture Issues (from deep scan)

1. **CRITICAL: JWT not verified** — auth-middleware.ts decodes JWT payload but never validates signature
2. **CRITICAL: Admin routes public** — /simple-admin, /admin-panel, /admin-accounts etc. outside ProtectedRoute
3. **CRITICAL: No RBAC** — ProtectedRoute checks user existence, not role
4. **MAJOR: Schema mismatch** — Drizzle schema.ts uses serial int PKs; migration uses UUIDs
5. **MAJOR: Triple auth system** — Three parallel authenticated-fetch implementations (api.ts, queryClient.ts, AuthContext)
6. **MAJOR: Dead storage code** — 5 unused storage implementations (~94KB), storage-factory hardcodes SupabasePublicStorage
7. **MAJOR: Route swap** — /transfer maps to InternationalTransfer and vice versa
8. **MAJOR: Empty log()** — vite.ts log function is empty, all logging disabled
9. **MAJOR: Broken serveStatic** — Resolves to server/public instead of dist/public
10. **MAJOR: .env.example contains real keys** — Service role key committed to repo
11. **MAJOR: Live chat table mismatch** — Uses chat_messages table with camelCase columns (Postgres expects snake_case)
12. **MAJOR: Serverless functions use wrong table names** — serverless.ts references users/accounts instead of user_profiles/bank_accounts

### Code Rabbit Pull-Request Audit Rules

All pull requests must pass these checks before merge:

1. **No secrets in code** — API keys, tokens, passwords must use environment variables
2. **No `any` types** — Use proper TypeScript interfaces
3. **No empty catch blocks** — All errors must be logged or handled
4. **No console.log in production** — Use proper logging
5. **RLS enabled on all tables** — Every new table must have RLS policies
6. **Input validation** — All API endpoints must validate input with Zod
7. **No hardcoded ports** — Use `process.env.PORT` for production
8. **No `unsafe-inline` in CSP** — Use nonce-based CSP
9. **Tests required** — New features must include tests
10. **No breaking changes without migration** — Schema changes require migration files

### Agent Behavioral Rules

1. **NEVER push directly to main** after initial setup — use `development` branch
2. **NEVER ask the user to write code** — handle 100% of code modifications
3. **NEVER delete or modify existing designs** without explicit permission
4. **ALWAYS preserve Supabase connections** — never overwrite .env
5. **ALWAYS run `npm run build`** before reporting task complete
6. **ALWAYS use mobile-first design** — optimize for iPhone touchscreens
7. **ALWAYS commit with clear messages** — follow conventional commits
8. **ALWAYS test via Vercel Preview** — user reviews on iPhone before production
