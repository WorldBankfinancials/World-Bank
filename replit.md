# World Bank

## Overview

The World Bank is a full-stack application providing secure international banking services. It enables customers to manage accounts, transfer funds globally, track investments, and access real-time support. Administrators are equipped with tools for customer management, transaction oversight, and system monitoring. The platform aims to deliver a modern, comprehensive banking experience with robust security and real-time capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 29, 2025 - Critical Authentication Fix
**Problem:** Widespread 401 authentication errors across 44+ frontend components making unauthenticated API requests.

**Root Cause:** Components using raw `fetch()` without Supabase JWT authentication headers, and race condition where API calls occurred before Supabase session initialization.

**Solution Implemented:**
1. Created `authenticatedFetch()` helper in `client/src/lib/queryClient.ts` that:
   - Automatically retrieves Supabase session token
   - Waits for session with exponential backoff retry logic (3 attempts: 500ms, 1000ms, 2000ms)
   - Throws clear error if no session available after retries (instead of silently proceeding)
   - Includes Authorization header with Bearer token in all requests
   - Logs failed requests for debugging

2. Systematically replaced ALL 44+ unauthenticated `fetch()` calls across:
   - Core components: Avatar.tsx, Header.tsx, UserWelcome.tsx
   - Customer pages: dashboard.tsx, history.tsx, cards.tsx, transfer.tsx, transfer-funds.tsx, transfer-process.tsx, international-transfer.tsx, transaction-history.tsx, account-preferences.tsx, pin-settings.tsx
   - Admin pages: admin-dashboard.tsx, admin-accounts.tsx, admin-transaction-dashboard.tsx, admin-transaction-creator.tsx, customer-management.tsx, fund-management.tsx, simple-admin.tsx
   - Context: AuthContext.tsx

**Pattern Used:**
```typescript
// BEFORE (WRONG - no auth)
const response = await fetch('/api/endpoint');

// AFTER (CORRECT - authenticated)
const { authenticatedFetch } = await import('@/lib/queryClient');
const response = await authenticatedFetch('/api/endpoint');
```

**Results:**
- ✅ Zero 401 authentication errors
- ✅ Zero LSP/TypeScript errors
- ✅ Consistent authentication across entire application
- ✅ Proper error handling with user-friendly messages
- ✅ Automatic retry logic prevents race conditions

**Files Exempt:** Login and registration pages intentionally use unauthenticated endpoints.

## System Architecture

### Frontend Architecture

The frontend is a React 18+ single-page application (SPA) built with TypeScript and Vite. It uses Wouter for routing, TanStack Query for server state management, and Shadcn/ui (based on Radix UI) for components, styled with Tailwind CSS (custom World Bank theme). Global state is managed via `AuthContext` and `LanguageContext`, with custom hooks encapsulating reusable logic. The design is mobile-first, responsive, and implements protected routes and error boundaries.

### Backend Architecture

The backend is built with Node.js and Express, utilizing TypeScript. Drizzle ORM is used for database schema and queries, while Supabase provides authentication and real-time features. PostgreSQL is the primary database. A factory pattern for storage allows pluggable implementations (in-memory, direct PostgreSQL, Supabase public schema). Authentication uses Supabase Auth with JWTs, enforced by middleware for role-based access control (`app_metadata.role`). API endpoints are RESTful, organized by feature, and include robust error handling and Zod schema validation.

### Database Design

The project uses PostgreSQL, managed by Drizzle Kit for migrations. Supabase is integrated for authentication and real-time updates, utilizing its public schema for `bank_*` tables. Key schema decisions include separating user profiles from Supabase authentication, using decimals for account balances, and tracking transaction statuses with audit trails. Row-level security is implemented via Supabase policies.

### Security Architecture

Authentication uses Supabase-issued JWTs, with service role keys restricted to the backend. Passwords are handled by Supabase Auth, and transfer PINs add transaction verification. Authorization is enforced through server-controlled roles in `app_metadata` and middleware (`requireAuth`, `requireAdmin`). Data protection includes HTTPS, non-exposure of sensitive data, input validation with Zod, and SQL injection prevention via Drizzle ORM.

### Real-time Features

Real-time capabilities are powered by Supabase Realtime, utilizing WebSockets and channels. This enables live chat, real-time balance and transaction updates, instant alerts for customers, and notifications for admin actions, ensuring immediate data synchronization across clients.

### Build and Deployment

Development uses `npm run dev` for concurrent frontend (Vite with HMR) and backend (tsx) servers. For production, `npm run build` compiles the TypeScript backend and an optimized frontend bundle. Environment configuration is managed via `.env` files and `NODE_ENV`.

## External Dependencies

### Authentication & Database
- **Supabase**: Primary authentication, real-time subscriptions, and optional PostgreSQL hosting.
- **Neon Database**: Alternative PostgreSQL provider.
- **Postgres**: Direct PostgreSQL connection.

### UI Component Libraries
- **Radix UI**: Accessible UI primitives.
- **Shadcn/ui**: Pre-styled components built on Radix UI and Tailwind CSS.
- **Lucide React**: Icon library.

### State Management & Data Fetching
- **TanStack Query**: Server state management, caching, and refetching.
- **React Hook Form**: Form state management with Zod validation.

### Styling & Design
- **Tailwind CSS**: Utility-first CSS framework with custom theming.
- **Framer Motion**: Animation library.
- **Class Variance Authority**: Type-safe variant styling.

### Development Tools
- **Vite**: Fast build tool and dev server.
- **TypeScript**: Type safety across the stack.
- **Drizzle ORM**: Type-safe SQL query builder and schema management.
- **ESLint & Prettier**: Code quality and formatting.

### Third-Party Services
- **Replit Infrastructure**: Hosting and object storage.
- **WebSocket Server**: Built-in `ws` package for real-time communication.

### Build & Deployment
- **tsx**: TypeScript execution for dev server.
- **Drizzle Kit**: Database migration tool.