# Task Plan — World Bank Digital Banking Application
## Active Progress Roadmap

Last Updated: 2026-07-09

---

## Phase 0: Infrastructure Configuration (CURRENT)

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

## Phase 1: Critical Security Fixes (NEXT)

### Broken — Requires Immediate Attention
- [ ] **JWT signature verification** — auth-middleware.ts decodes but never verifies JWT signatures. Anyone can forge a token.
- [ ] **Admin routes public** — /admin-dashboard, /simple-admin, /admin-live-chat, /customer-service are outside ProtectedRoute in App.tsx. No authentication required.
- [ ] **No RBAC** — ProtectedRoute only checks if user exists, not their role. Any logged-in user can access admin tools.
- [ ] **PIN plaintext** — Transfer PINs stored and compared without hashing in routes-transfer.ts. Vulnerable to timing attacks.
- [ ] **Service role key in .env.example** — Real SUPABASE_SERVICE_ROLE_KEY committed in plaintext. Bypasses all RLS.

### Working but Needs Hardening
- [ ] CSP allows unsafe-inline and unsafe-eval for scripts (server/index.ts)
- [ ] No CSRF protection (X-CSRF-Token header is just echoed back)
- [ ] Rate limiter exists (rate-limiter.ts) but not visible in route registration

---

## Phase 2: Architecture Reconciliation

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
| GitHub repo | Working | Cloned, main branch, 231 files |
| Supabase DB | Live | 7 tables, 0 rows, RLS enabled |
| Express server | Partially working | Port 5000, logging disabled, static path broken |
| React client | Working | 53 pages, 16 components, mobile-first |
| Auth system | Broken | JWT not verified, triple auth paths, no RBAC |
| Transfer routes | Partially working | PIN plaintext, race conditions on balance |
| Realtime chat | Configured | WebSocket at /ws/chat, Supabase realtime |
| CI/CD | Configured | GitHub Actions (ci.yml, codeql.yml) |
| Vercel deploy | Configured | vercel-build script in package.json |
| Testing | Missing | No test framework installed |
| Monitoring | Missing | No Sentry, no error tracking |
