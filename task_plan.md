# Task Plan — World Bank Digital Banking Application
## Active Progress Roadmap

Last Updated: 2026-07-09

---

## Phase 0: Infrastructure Configuration (COMPLETE)

### Completed
- [x] GitHub repository cloned (WorldBankfinancials/World-Bank, main branch, commit 2bb3cfb)
- [x] Deep read-only architecture scan completed (4 sub-agents, full codebase analysis)
- [x] Supabase database verified (7 tables, 1 migration, RLS enabled on all tables)
- [x] .vscode/settings.json created (format-on-save, search exclusions, TS config)
- [x] .vscode/extensions.json created (Copilot, Supabase, Tailwind, ESLint, Prettier)
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
- [x] **JWT signature verification** — auth-middleware.ts now validates tokens via Supabase Auth getUser() instead of decoding without verification. Forged tokens are rejected.
- [x] **Admin routes protected** — Created AdminRoute component that checks user.role === 'admin'. All 6 admin routes wrapped in AdminRoute instead of ProtectedRoute.
- [x] **RBAC enforced** — AdminRoute redirects non-admin users to /dashboard. Server-side requireAdmin middleware checks role from verified JWT.
- [x] **PIN hashing** — Transfer PINs already hashed with bcrypt (verified in routes-transfer.ts lines 55, 163).
- [x] **Service role key removed from .env.example** — Replaced with placeholder. Real key only via Vercel Dashboard.

### Hardened
- [x] **CSP hardened** — Removed unsafe-inline and unsafe-eval from script-src. Switched to nonce-based CSP with per-request crypto nonce.
- [x] **CSRF protection** — State-changing requests (POST/PUT/PATCH/DELETE) to /api/ must include X-CSRF-Token header. Auth endpoints exempt.
- [x] **Rate limiter wired** — generalRateLimiter on all /api/ routes, authRateLimiter on login, transactionRateLimiter on all transfer/transaction endpoints.
- [x] **Port fix** — server/index.ts now uses process.env.PORT with fallback to 5000.

### PR: https://github.com/WorldBankfinancials/World-Bank/pull/27

---

## Phase 2: Architecture Reconciliation (NEXT)

### Schema Conflicts (3 incompatible definitions)
- [ ] Reconcile Drizzle schema.ts (serial int PKs) with migration 001_banking_schema.sql (UUID PKs)
- [ ] Remove or update server/RLS-POLICIES.sql (references bank_* tables not in migration)
- [ ] Remove or update sql/rls-policies.sql (uses auth.uid()::int which crashes at runtime)
- [ ] Align supabase-mapping.ts types with actual migration schema (UUID, not number)
- [ ] Add missing tables to migration: documents, admin_actions, support_tickets, investments

### Storage Layer
- [ ] storage-factory.ts hardcodes SupabasePublicStorage — config.ts selection logic is dead code
- [ ] ARCHITECTURE.md claims CompleteSupabaseStorage is active but factory uses SupabasePublicStorage
- [ ] All storage implementations silently swallow errors — return undefined/[] on every failure
- [ ] Column name inconsistency: supabase_user_id (postgres-storage) vs supabase_id (hybrid-postgres-storage)

### Auth System Consolidation
- [ ] Three parallel authenticated-fetch implementations (api.ts, queryClient.ts, supabase.ts)
- [ ] Inconsistent 401 handling: apiFetch clears token, authenticatedFetch clears all + redirects
- [ ] AuthContext uses localStorage tokens; supabase.ts uses Supabase sessions — unclear which is active
- [ ] auth-middleware.ts uses VITE_SUPABASE_URL (client env var) on server

---

## Phase 3: Code Quality & Bug Fixes

### Broken Functionality
- [ ] **log() function empty** — server/vite.ts log function does nothing, all server logging disabled
- [ ] **serveStatic path broken** — resolves to server/public instead of dist/public
- [ ] **Route/component swap** — /transfer maps to InternationalTransfer, /international-transfer maps to Transfer
- [ ] **Duplicate /about route** — declared both publicly and in protected switch
- [ ] **Error handler re-throws** — server/index.ts throws after sending response

### Dead Code & Orphaned Files
- [ ] 5+ orphaned page files not imported in App.tsx (admin-accounts, enhanced-admin, registration, support-ticket, transfer-process)
- [ ] supabase-public-storage.ts.bak backup file should be removed
- [ ] logConfiguration() in config.ts is empty function
- [ ] getAuthSource() always returns 'supabase' — 'backend' path is unreachable
- [ ] Drizzle db instance in supabase-storage.ts created but never used

### Performance
- [ ] getAllTransactions() called and filtered in-memory for admin operations instead of querying by ID
- [ ] Radix UI packages excluded from optimizeDeps — slow dev startup
- [ ] drizzle-orm in client dependencies — shouldn't be in browser bundle
- [ ] next-themes dependency in a Vite app (designed for Next.js)

---

## Phase 4: Missing Infrastructure

### Testing
- [ ] No test framework installed (no Jest, Vitest, Testing Library, Playwright)
- [ ] No test files exist
- [ ] Banking application requires comprehensive test coverage

### RLS Policy Gaps (Migration)
- [ ] transaction_approvals has RLS enabled but NO policies — all access denied
- [ ] messages SELECT policy uses USING(true) — all users can read all messages
- [ ] No INSERT policy on bank_accounts — users cannot create accounts
- [ ] No INSERT/UPDATE policy on transactions — transactions cannot be created/updated
- [ ] No INSERT policy on cards — cards cannot be created
- [ ] No DELETE policies on most tables

### Environment Variable Standardization
- [ ] Standardize on VITE_SUPABASE_URL vs SUPABASE_URL (currently both used)
- [ ] Standardize on DATABASE_URL vs SUPABASE_DATABASE_URL (Drizzle uses different name)
- [ ] VITE_SUPABASE_ANON_KEY defined in .env.example but never used by server

---

## Phase 5: Feature Roadmap (Future)

- [ ] World Bank financial data integration (trigger.config.json configured, needs implementation)
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
| GitHub repo | Working | main + development branches, 231 files |
| Supabase DB | Live | 7 tables, 0 rows, RLS enabled |
| Express server | Partially working | Port now dynamic (process.env.PORT), CSP hardened, rate limited |
| React client | Working | 53 pages, 16 components, mobile-first, admin routes protected |
| Auth system | Fixed | JWT verified via Supabase, RBAC enforced, admin routes protected |
| Transfer routes | Working | PIN hashed with bcrypt, rate limited |
| Realtime chat | Configured | WebSocket at /ws/chat, Supabase realtime |
| CI/CD | Configured | GitHub Actions (ci.yml, codeql.yml) |
| Vercel deploy | Configured | vercel-build script, dynamic port |
| Testing | Missing | No test framework installed |
| Monitoring | Missing | No Sentry, no error tracking |
