# CLAUDE.md — World Bank Digital Banking Application
## The Digital Constitution & 10-Layer Strategic Architecture

### Project Identity
- **Name**: World Bank Digital Banking (Apex Banking Corporation)
- **Repository**: WorldBankfinancials/World-Bank (GitHub)
- **Platform**: Mobile-first web application (iPhone browser optimized)
- **Backend**: Supabase PostgreSQL (actively running, 19 tables, 5 migrations, 74 RLS policies)
- **Hosting**: Vercel (production) with preview deployments

---

### The 10-Layer Strategic Architecture

| Layer | Name | Purpose |
|------|------|---------|
| 1 | Presentation | React 18 + Vite + Tailwind + shadcn/ui (mobile-first) |
| 2 | Routing | Wouter (lightweight client-side routing) |
| 3 | State Management | TanStack Query + AuthContext (localStorage) + LanguageContext |
| 4 | API Gateway | Express.js with ~78 endpoints, rate limiting, CSP |
| 5 | Business Logic | Transfer routes, transaction wrapper, approval workflow |
| 6 | Data Access | SupabasePublicStorage (Supabase REST API, service role key) |
| 7 | Database | Supabase PostgreSQL (19 tables, 74 RLS policies, UUID PKs) |
| 8 | Realtime | WebSocket /ws/chat + Supabase Realtime subscriptions |
| 9 | Security | JWT auth, RBAC, bcrypt PIN hashing, CSRF protection |
| 10 | Infrastructure | Vercel deployment, GitHub Actions CI, Trigger.dev cron jobs |

### The 4-Tier Framework

| Tier | Name | Scope |
|------|------|-------|
| Vision | 10-year architecture | Sovereign banking platform, global financial data integration |
| Architecture | System design | Modular monolith, event-driven, Supabase-centric |
| Platform | Technology stack | React + Express + Supabase + Vercel |
| Products | User-facing features | Transfers, cards, investments, admin panel, support |

### The 10 Principles of the Digital Constitution

1. **Sovereignty** — The user owns their data. RLS on every table. No data leaves Supabase without explicit consent.
2. **Transparency** — All admin actions logged in wb_audit_logs. All security events tracked in wb_security_events.
3. **Resilience** — Circuit breakers on all external calls. Retry queues for failed transactions. Atomic balance updates.
4. **Precision** — Idempotency keys on all financial transactions. No duplicate transfers. No lost data.
5. **Velocity** — Mobile-first design. Sub-2-second page loads. Vercel edge deployment.
6. **Intelligence** — World Bank API data integration. Real-time financial indexes. Automated cron jobs.
7. **Security** — JWT signature verification. RBAC enforced. bcrypt hashing. CSRF protection. CSP headers.
8. **Evolvability** — Modular monolith architecture. Clean separation of concerns. No breaking changes without migration.
9. **Observability** — System events logged. Health checks. Performance indexes on all query patterns.
10. **Autonomy** — AI agents handle 100% of code. User reviews via preview links. No manual coding required.

### The 10-Year Architecture Rules

1. Never delete user data. Migrations add, never remove.
2. Every table has RLS. Every policy uses auth.uid().
3. Every API endpoint validates input with Zod.
4. Every financial operation is idempotent.
5. Every external call has a circuit breaker.
6. Every admin action is audited.
7. Every security event is logged.
8. Every table has a UUID primary key.
9. Every migration is idempotent (IF NOT EXISTS).
10. Every push goes through the 6 Quality Gates.

### The Grand Master Organism Architecture

| Organ | System | Technology | Purpose |
|-------|--------|-----------|---------|
| **Brain** | Decision Engine | Express API + business logic | Processes all financial decisions, transfer approvals, rate limiting |
| **Heart** | Core Database | Supabase PostgreSQL | Pumps data through 19 tables, 74 RLS policies, maintains all balances |
| **Nervous System** | Realtime Layer | WebSocket + Supabase Realtime | Instant notifications, live chat, transaction updates |
| **Eyes** | Monitoring | System events + audit logs | Observability, health checks, security event tracking |
| **Immune System** | Security Layer | JWT + RBAC + bcrypt + CSRF + CSP | Defends against unauthorized access, forgery, injection |
| **Lungs** | Background Jobs | Trigger.dev + World Bank API | Breathes in global financial data nightly, keeps system oxygenated |
| **DNA** | Schema | 5 Sovereign Ministries, 9 wb_ tables | Genetic blueprint for all data relationships and constraints |

### High-Grade Monorepo Physical Directory Layout

```
project/
├── apps/
│   ├── web/              # Customer-facing banking app (React + Vite)
│   ├── admin/            # Admin dashboard and tools
│   └── api/              # Express API server
├── packages/
│   ├── shared-kernel/    # Types, schemas, constants shared across apps
│   ├── auth-engine/      # Authentication and authorization logic
│   ├── banking-engine/   # Transfer, balance, transaction logic
│   └── ui-engine/        # Shared UI component library
├── infrastructure/
│   ├── migrations/       # SQL migration files
│   └── supabase/         # Supabase configuration and edge functions
├── docs/                # Engineering Reference Handbook (8 volumes)
├── tests/               # Integration and E2E tests
├── .vscode/             # Workspace settings
├── .claudecode/         # Claude Code OpenRouter bridge
├── .github/workflows/   # CI/CD pipelines
└── .husky/              # Git hooks
```

### Core Engineering Philosophy

- **Modular Monolith**: Single deployable unit with clean internal boundaries. Not microservices.
- **Event-Driven**: Universal Event Language vocabulary (User.Created, Transfer.Completed, Security.AlertRaised).
- **Supabase-Centric**: Database is the source of truth. RLS is the security boundary. Edge functions for external APIs.
- **Mobile-First**: Every UI decision starts with the iPhone viewport. Touch targets, bottom nav, responsive charts.
- **AI-Autonomous**: Agents write, test, and deploy code. The product manager reviews layouts, not code.

---

### File Architecture Map (Current State)

```
project/
├── client/                    # React 18 + Vite frontend
│   ├── src/
│   │   ├── App.tsx           # Root component, wouter routing, provider stack
│   │   ├── pages/            # ~53 page components
│   │   ├── components/       # 16 custom + ui/ (shadcn/Radix)
│   │   ├── contexts/         # AuthContext, LanguageContext
│   │   ├── hooks/            # Realtime, presence, user data
│   │   └── lib/              # supabase.ts, api.ts, queryClient.ts
├── server/                   # Express + TypeScript backend (34 files)
│   ├── index.ts              # Express bootstrap, process.env.PORT
│   ├── auth-middleware.ts    # JWT verification via Supabase
│   ├── storage-factory.ts    # SupabasePublicStorage singleton
│   ├── routes-transfer.ts    # Transfer API endpoints
│   └── fix-routes.ts         # ~78 API endpoints
├── shared/schema.ts          # Drizzle ORM schema
├── supabase/migrations/      # 4 applied migrations
├── infrastructure/migrations/ # High-grade core banking schema
├── .github/workflows/        # CI (ci.yml, codeql.yml)
└── .vscode/                  # Workspace settings
```

### Active Database Connections

| Variable | Used By | Purpose |
|----------|---------|---------|
| `VITE_SUPABASE_URL` | Client + Server | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Client-side Supabase access |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Server-side privileged access |
| `DATABASE_URL` | Server (legacy storage) | Direct PostgreSQL connection |
| `SUPABASE_DATABASE_URL` | Drizzle Kit | Migration tooling |

### Production Port Map

| Service | Port | Environment Variable |
|---------|------|---------------------|
| Express API server | `process.env.PORT` (fallback 5000) | `PORT` |
| Vite dev server | 5173 | Root vite.config.ts |
| WebSocket chat | `/ws/chat` | Attached to Express |
| Vercel production | Dynamic | `process.env.PORT` |

### Supabase Database Schema (19 tables, 74 RLS policies, 5 migrations)

**Legacy Tables (10):** user_profiles, bank_accounts, transactions, cards, alerts, messages, transaction_approvals, admin_actions, support_tickets, investments

**High-Grade Core Tables (9):** wb_users, wb_profiles, wb_accounts, wb_transactions, wb_notifications, wb_messages, wb_security_events, wb_audit_logs, wb_system_events

**Helper Functions:** wb_atomic_balance_update, wb_execute_transfer, update_updated_at_column

### Code Rabbit Pull-Request Audit Rules

1. No secrets in code
2. No `any` types
3. No empty catch blocks
4. No console.log in production
5. RLS enabled on all tables
6. Input validation on all API endpoints
7. No hardcoded ports
8. No `unsafe-inline` in CSP
9. Tests required for new features
10. No breaking changes without migration

### Agent Behavioral Rules

1. **NEVER push directly to main** after initial setup — use `development` branch
2. **NEVER ask the user to write code** — handle 100% of code modifications
3. **NEVER delete or modify existing designs** without explicit permission
4. **ALWAYS preserve Supabase connections** — never overwrite .env
5. **ALWAYS run the 6 Quality Gates** before reporting task complete
6. **ALWAYS use mobile-first design** — optimize for iPhone touchscreens
7. **ALWAYS commit with clear messages** — follow conventional commits
8. **ALWAYS test via Vercel Preview** — user reviews on iPhone before production
