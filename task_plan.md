# Task Plan — World Bank Digital Banking Application
## Active Progress Roadmap

Last Updated: 2026-07-09

---

## Phase 0: Infrastructure Configuration (COMPLETE)

### Completed
- [x] GitHub repository cloned (WorldBankfinancials/World-Bank, main branch)
- [x] Deep read-only architecture scan completed (4 sub-agents, full codebase analysis)
- [x] Supabase database verified (10 tables, 4 migrations, RLS enabled on all tables)
- [x] .vscode/settings.json created (format-on-save, search exclusions, Supabase env vars)
- [x] .vscode/extensions.json created (Copilot, Supabase, Tailwind, React snippets, ESLint)
- [x] .claudecode/settings.json.local created (OpenRouter bridge, Gemini/DeepSeek routing)
- [x] .aider.conf.yml created (auto-commit, file restrictions, safe dev framework)
- [x] gemini-cli.config.json created (free-tier model routing, sandbox, safety blocks)
- [x] .geminirc created (environment flags, execution shortcuts)
- [x] trigger.config.json created (nightly World Bank API sync to Supabase, Qodo validation)
- [x] CLAUDE.md created (architecture map, port maps, Code Rabbit audit rules)
- [x] PROJECT.md created (agent behavioral rules, user constraints)
- [x] task_plan.md created (this file)
- [x] mcp.json created (GitHub + Supabase MCP server context bridge)
- [x] All files pushed to GitHub main branch

---

## Phase 1: Critical Security Fixes (COMPLETE — PR #27)

### Fixed
- [x] **JWT signature verification** — auth-middleware.ts now validates tokens via Supabase Auth getUser()
- [x] **Admin routes protected** — Created AdminRoute component that checks user.role === 'admin'
- [x] **RBAC enforced** — AdminRoute redirects non-admin users to /dashboard
- [x] **PIN hashing** — Transfer PINs hashed with bcrypt
- [x] **Service role key removed from .env.example** — Replaced with placeholder

### Hardened
- [x] **CSP hardened** — Removed unsafe-inline and unsafe-eval, nonce-based CSP
- [x] **CSRF protection** — State-changing requests require X-CSRF-Token header
- [x] **Rate limiter wired** — generalRateLimiter, authRateLimiter, transactionRateLimiter
- [x] **Port fix** — server/index.ts now uses process.env.PORT with fallback to 5000

### PR: https://github.com/WorldBankfinancials/World-Bank/pull/27

---

## Phase 1.5: Supabase Database Integration (COMPLETE)

### Migrations Applied
- [x] **Migration 002**: Fixed RLS policies on all 7 existing tables + added 3 new tables
  - bank_accounts: Added INSERT and DELETE policies
  - transactions: Added INSERT and UPDATE policies
  - cards: Added INSERT, UPDATE, DELETE policies
  - alerts: Added INSERT and DELETE policies
  - messages: Tightened SELECT policy from USING(true) to sender-only access
  - transaction_approvals: Added 3 admin-only policies (was locked with zero policies)
  - user_profiles: Added DELETE policy
  - NEW TABLE: admin_actions (admin operation logging, admin-only access)
  - NEW TABLE: support_tickets (customer support, user + admin access)
  - NEW TABLE: investments (investment portfolio, owner-scoped)
  - Added performance indexes on all foreign key columns

- [x] **Migration 003**: Added missing columns to user_profiles
  - email, username, password_hash, account_number, account_id, balance
  - profession, is_active, is_verified, transfer_pin, role
  - Added indexes on email and role columns

- [x] **Migration 004**: Added missing transfer columns to transactions
  - from_user_id, recipient_name, recipient_account, recipient_country
  - bank_name, swift_code, account_number, transfer_purpose
  - Added indexes on from_user_id and status

### Final Database State
| Table | Columns | RLS Policies | Purpose |
|-------|---------|---------------|---------|
| user_profiles | 36 | 4 (CRUD) | User accounts, KYC, auth |
| bank_accounts | 17 | 4 (CRUD) | User bank accounts |
| transactions | 34 | 3 (SELECT/INSERT/UPDATE) | Transfers and transactions |
| cards | 15 | 4 (CRUD) | Debit/credit cards |
| alerts | 14 | 4 (CRUD) | User notifications |
| messages | 12 | 4 (CRUD) | Chat messages |
| transaction_approvals | 8 | 3 (admin-only) | Admin approval workflow |
| admin_actions | 7 | 2 (admin-only) | Admin action logging |
| support_tickets | 8 | 5 (user + admin) | Support ticket system |
| investments | 10 | 4 (CRUD) | Investment portfolio |

**Total: 10 tables, 37 RLS policies, all with proper ownership checks**

---

## Phase 2: Architecture Reconciliation (NEXT)

### Schema Conflicts
- [ ] Reconcile Drizzle schema.ts (serial int PKs) with migration schema (UUID PKs)
- [ ] Remove or update server/RLS-POLICIES.sql (references bank_* tables not in migration)
- [ ] Remove or update sql/rls-policies.sql (uses auth.uid()::int which crashes at runtime)
- [ ] Align supabase-mapping.ts types with actual migration schema (UUID, not number)

### Storage Layer
- [ ] storage-factory.ts hardcodes SupabasePublicStorage — config.ts selection logic is dead code
- [ ] All storage implementations silently swallow errors — return undefined/[] on every failure
- [ ] Column name inconsistency: supabase_user_id (postgres-storage) vs supabase_id (hybrid-postgres-storage)

### Auth System Consolidation
- [ ] Three parallel authenticated-fetch implementations (api.ts, queryClient.ts, supabase.ts)
- [ ] Inconsistent 401 handling: apiFetch clears token, authenticatedFetch clears all + redirects
- [ ] AuthContext uses localStorage tokens; supabase.ts uses Supabase sessions — unclear which is active

---

## Phase 3: Code Quality & Bug Fixes

### Broken Functionality
- [ ] **log() function empty** — server/vite.ts log function does nothing
- [ ] **serveStatic path broken** — resolves to server/public instead of dist/public
- [ ] **Route/component swap** — /transfer maps to InternationalTransfer, /international-transfer maps to Transfer
- [ ] **Duplicate /about route** — declared both publicly and in protected switch

### Dead Code & Orphaned Files
- [ ] 5+ orphaned page files not imported in App.tsx
- [ ] supabase-public-storage.ts.bak backup file should be removed
- [ ] logConfiguration() in config.ts is empty function
- [ ] Drizzle db instance in supabase-storage.ts created but never used

---

## Phase 4: Missing Infrastructure

### Testing
- [ ] No test framework installed (no Jest, Vitest, Testing Library, Playwright)
- [ ] No test files exist

### Environment Variable Standardization
- [ ] Standardize on VITE_SUPABASE_URL vs SUPABASE_URL (currently both used)
- [ ] Standardize on DATABASE_URL vs SUPABASE_DATABASE_URL (Drizzle uses different name)

---

## Phase 5: Feature Roadmap (Future)

- [ ] World Bank financial data integration
- [ ] Multi-language expansion (currently en/zh only)
- [ ] Biometric authentication for mobile
- [ ] Push notifications
- [ ] Statement export (PDF/CSV)
- [ ] Card management (freeze/unfreeze, limits)
- [ ] Investment portfolio tracking
- [ ] International transfer tracking with real-time status

---

## Application State Summary

| Component | Status | Notes |
|-----------|--------|-------|
| GitHub repo | Working | main + development branches, PR #27 open |
| Supabase DB | Live | 10 tables, 37 RLS policies, 4 migrations, all empty |
| Express server | Partially working | Dynamic port, CSP hardened, rate limited |
| React client | Working | 53 pages, 16 components, mobile-first, admin routes protected |
| Auth system | Fixed | JWT verified via Supabase, RBAC enforced |
| Transfer routes | Working | PIN hashed with bcrypt, rate limited |
| Realtime chat | Configured | WebSocket at /ws/chat, Supabase realtime |
| CI/CD | Configured | GitHub Actions (ci.yml, codeql.yml) |
| Vercel deploy | Configured | vercel-build script, dynamic port |
| Testing | Missing | No test framework installed |
| Monitoring | Missing | No Sentry, no error tracking |
