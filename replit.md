# World Bank Digital Banking Platform

## Overview

World Bank Digital Banking Platform is a comprehensive full-stack banking application that provides secure international banking services. The platform enables customers to manage accounts, transfer funds internationally, track investments, and receive real-time support. Administrators have robust tools for customer management, transaction oversight, and system monitoring.

The application is built as a modern single-page application (SPA) with a React frontend and Express backend, utilizing Supabase for authentication and real-time features, with support for PostgreSQL database storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### October 28, 2025 - Real-Time Features & Complete Database Integration
**Real-Time Infrastructure (Production-Ready):**
- Implemented real-time presence tracking using Supabase Realtime channels
  - Created `usePresence` hook for tracking user online/offline status
  - Created `useOnlineUsers` hook for admin visibility of active customers
  - Integrated into customer dashboard and admin customer management pages
- Implemented real-time transaction updates
  - Created `useRealtimeTransactions` hook for live transaction approval notifications
  - Admin dashboard automatically refreshes when pending transfers require approval
  - PostgreSQL change detection via Supabase Realtime postgres_changes events
- Implemented real-time support ticket updates
  - Created `useRealtimeSupportTickets` hook for live ticket status changes
  - Automatic query invalidation when tickets are created/updated
- Implemented real-time alerts for customers
  - Created `useRealtimeAlerts` hook with user-specific filtering
  - Alerts page automatically updates when new alerts arrive
- Auto-refreshing market data and investment rates
  - Investment page refreshes market data every 60 seconds
  - Background refresh continues even when tab is not focused
- Status: Architect reviewed and approved as production-ready

**Mock Data Elimination (100% Complete):**
- Removed all mock data from statements-reports.tsx - connected to /api/statements
- Removed all mock data from find-branches.tsx - connected to /api/branches and /api/atms
- Removed all mock data from alerts.tsx - connected to /api/alerts with real-time updates
- Fixed investment.tsx to use real /api/market-rates data with auto-refresh
- All pages now use real database data with proper loading/error/empty states

**Critical Security Fixes:**
- Fixed frontend registration to fail immediately when Supabase Auth fails (prevents orphaned database users)
- Removed password transmission from frontend to backend (passwords only handled by Supabase Auth)
- Created secure `/api/auth/register` endpoint with server-side field whitelisting
- Blocked privilege escalation by hardcoding role, balance, isVerified, and isActive server-side
- Added explicit validation rejecting password submissions and non-customer role attempts
- All privileged fields now server-controlled; client can only set safe profile information

**Admin Live Chat System:**
- Removed all mock data from admin-live-chat page
- Fixed WebSocket handler to create chat sessions dynamically from incoming customer messages
- System now operates entirely on real database data

**Support System:**
- Added `/api/support-tickets` GET and POST endpoints for customer support system
- Support tickets now fully integrated with real database storage

## System Architecture

### Frontend Architecture

**Technology Stack:**
- React 18+ with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management
- Shadcn/ui component library built on Radix UI primitives
- Tailwind CSS for utility-first styling with custom World Bank theme

**Component Organization:**
- Components are organized in `client/src/components/` with reusable UI primitives
- Pages are route-based in `client/src/pages/` following a flat structure
- Contexts (`AuthContext`, `LanguageContext`) provide global state for authentication and internationalization
- Custom hooks in `client/src/hooks/` encapsulate reusable logic

**State Management Approach:**
- Authentication state managed through `AuthContext` with Supabase integration
- Server data cached and synchronized via TanStack Query
- Local UI state managed with React hooks
- Real-time updates handled through Supabase Realtime subscriptions

**Design Patterns:**
- Protected routes wrap authenticated pages to enforce access control
- Error boundaries catch and handle component-level errors gracefully
- Custom theme extends Tailwind with World Bank branding (`.wb-*` utility classes)
- Responsive mobile-first design with dedicated bottom navigation for mobile devices

### Backend Architecture

**Technology Stack:**
- Node.js with Express framework
- TypeScript for type safety across the stack
- Drizzle ORM for database schema and queries
- Supabase for authentication, real-time features, and optional storage
- PostgreSQL as the primary database (via Neon or Supabase)

**Storage Layer Design:**
- Factory pattern (`storage-factory.ts`) provides pluggable storage implementations
- Three storage adapters: `MemStorage` (in-memory), `PostgresStorage` (direct PostgreSQL), `SupabasePublicStorage` (Supabase public schema)
- Storage selection based on environment configuration with automatic fallback
- All storage implementations conform to `IStorage` interface for consistency

**Authentication Flow:**
- Supabase Auth handles user authentication with JWT tokens
- Middleware (`auth-middleware.ts`) extracts and verifies JWT from Authorization headers
- Role-based access control using `app_metadata.role` (server-controlled, not user-modifiable)
- Separate admin and customer authentication flows with role verification

**API Structure:**
- RESTful endpoints organized by feature domain
- Routes defined in `fix-routes.ts` with modular transfer routes in `routes-transfer.ts`
- Middleware chain: logging → authentication → authorization → route handler
- Error handling middleware catches and formats errors consistently

**Data Models:**
- Shared schema definitions in `shared/schema.ts` using Drizzle ORM
- Core entities: users, accounts, transactions, cards, investments, support tickets, messages, alerts
- Supabase-specific schema in `shared/supabase-schema.ts` for Supabase public schema tables
- Type safety enforced with Zod schemas for validation

### Database Design

**Primary Database:**
- PostgreSQL configured via `DATABASE_URL` environment variable
- Drizzle Kit manages migrations in `migrations/` directory
- Schema supports multi-currency accounts and international transactions

**Supabase Integration:**
- Optional Supabase backend provides authentication and real-time synchronization
- Public schema tables prefixed with `bank_*` to avoid conflicts
- Real-time subscriptions for live chat, alerts, and transaction updates
- Row-level security policies enforce data access controls

**Key Schema Decisions:**
- User profiles separated from authentication (auth handled by Supabase, profiles in `bank_users`)
- Account balances stored as decimals with precision 15, scale 2 for accuracy
- Transaction status tracking with audit trail (pending, approved, rejected, completed)
- Support for multiple accounts per user with different types (checking, savings, investment)

### Security Architecture

**Authentication Security:**
- JWTs issued by Supabase with automatic refresh
- Service role key used only on backend for admin operations
- Password hashing handled by Supabase Auth
- Transfer PIN for additional transaction verification

**Authorization Model:**
- Role stored in `app_metadata` (admin-controlled) prevents privilege escalation
- Middleware functions `requireAuth` and `requireAdmin` enforce access control
- Protected routes on frontend redirect unauthenticated users to login
- API endpoints validate user identity from JWT before processing requests

**Data Protection:**
- HTTPS enforced in production
- Sensitive data (transfer PINs, passwords) never exposed in API responses
- Input validation using Zod schemas before database operations
- SQL injection prevented through parameterized queries via Drizzle ORM

### Real-time Features

**Implementation:**
- Supabase Realtime for live updates across clients
- WebSocket connections for bidirectional communication
- Channels for chat messages, alerts, and transaction notifications
- Automatic reconnection handling on connection loss

**Use Cases:**
- Live chat between customers and admin support
- Real-time balance updates after transactions
- Instant alerts for security events and transaction approvals
- Notifications for pending transfers requiring admin action

### Build and Deployment

**Development Workflow:**
- `npm run dev` starts concurrent frontend (Vite) and backend (tsx) servers
- Hot module replacement for instant frontend updates
- TypeScript compilation with strict type checking

**Production Build:**
- `npm run build` compiles TypeScript backend to `dist/server/`
- Vite builds optimized frontend bundle to `dist/public/`
- Code splitting for vendor chunks (React, Radix UI components)
- Asset optimization and minification

**Environment Configuration:**
- `.env` file for local development secrets
- Environment detection via `NODE_ENV`
- Replit-specific plugins for runtime error overlay and cartographer integration

## External Dependencies

### Authentication & Database
- **Supabase** - Primary authentication provider and optional database backend. Provides JWT-based auth, real-time subscriptions, and PostgreSQL hosting. Environment variables: `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_ANON_KEY`
- **Neon Database** - Alternative PostgreSQL provider via `@neondatabase/serverless`. Configured through `DATABASE_URL`
- **Postgres** - Direct PostgreSQL connection via `postgres` npm package for database queries

### UI Component Libraries
- **Radix UI** - Comprehensive set of accessible UI primitives (dialogs, dropdowns, tooltips, etc.). Provides foundation for all interactive components
- **Shadcn/ui** - Pre-styled component collection built on Radix UI with Tailwind CSS
- **Lucide React** - Icon library providing consistent iconography across the application

### State Management & Data Fetching
- **TanStack Query** - Server state management with intelligent caching, background refetching, and optimistic updates
- **React Hook Form** - Form state management with `@hookform/resolvers` for Zod validation integration

### Styling & Design
- **Tailwind CSS** - Utility-first CSS framework with custom World Bank theme configuration
- **Framer Motion** - Animation library for smooth transitions and interactive elements
- **Class Variance Authority** - Type-safe variant styling for component design systems

### Development Tools
- **Vite** - Lightning-fast build tool and dev server with HMR
- **TypeScript** - Type safety across frontend and backend codebases
- **Drizzle ORM** - Type-safe SQL query builder and schema management
- **ESLint & Prettier** - Code quality and formatting enforcement

### Third-Party Services
- **Replit Infrastructure** - Hosting platform with object storage capability (via sidecar endpoint at `127.0.0.1:1106`)
- **WebSocket Server** - Built-in `ws` package for real-time bidirectional communication

### Build & Deployment
- **tsx** - TypeScript execution for development server
- **Vercel** - Optional deployment target with `vercel-build` script
- **Drizzle Kit** - Database migration tool for schema changes