# World Bank

## Overview

The World Bank project is a full-stack application designed to provide secure and comprehensive international banking services. It allows customers to manage accounts, perform global fund transfers, track investments, and access real-time support. Administrators are provided with tools for customer management, transaction oversight, and system monitoring. The platform aims to offer a modern, real-time, and secure banking experience.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is a React 18+ single-page application (SPA) built with TypeScript and Vite. It leverages Wouter for routing, TanStack Query for server state management, and Shadcn/ui (based on Radix UI) for components, styled using Tailwind CSS with a custom World Bank theme. Global state is managed via `AuthContext` and `LanguageContext`, with custom hooks for reusable logic. The design is mobile-first, responsive, and includes protected routes and error boundaries. Authentication uses `authenticatedFetch()` for consistent, secure API requests.

### Backend Architecture

The backend is developed with Node.js and Express in TypeScript. Drizzle ORM is used for database schema and queries, while Supabase handles authentication and real-time features. PostgreSQL serves as the primary database. A factory pattern for storage allows pluggable implementations (Supabase REST API is active). Authentication is via Supabase Auth with JWTs, enforced by middleware for role-based access control based on `app_metadata.role`. API endpoints are RESTful, feature-organized, and include robust error handling and Zod schema validation. Content Security Policy (CSP) headers are configured to allow necessary external services for real-time functionality.

### Database Design

The project uses PostgreSQL, with Drizzle Kit for migrations. Supabase is integrated for authentication and real-time updates, utilizing its public schema for `bank_*` tables. Key design principles include separating user profiles from Supabase authentication, using decimals for account balances, and tracking transaction statuses with audit trails. Row-level security is enforced via Supabase policies.

### Security Architecture

Authentication relies on Supabase-issued JWTs, with service role keys restricted to the backend. Passwords are managed by Supabase Auth, and transfer PINs are used for transaction verification. Authorization is enforced through server-controlled roles in `app_metadata` and middleware (`requireAuth`, `requireAdmin`). Data protection measures include HTTPS, non-exposure of sensitive data, input validation with Zod, and SQL injection prevention via Drizzle ORM.

### Real-time Features

Real-time capabilities are driven by Supabase Realtime, utilizing WebSockets and channels for live chat, real-time balance and transaction updates, instant customer alerts, and administrator notifications. A WebSocket server (`/ws/chat`) is also implemented for admin live chat with exponential reconnect. Frontend hooks like `useSupabaseRealtimeAccounts` facilitate integration.

### Build and Deployment

Development uses `npm run dev` for concurrent frontend (Vite with HMR) and backend (tsx) servers. For production, `npm run build` compiles the TypeScript backend and an optimized frontend bundle. Environment configuration is managed via `.env` files.

## External Dependencies

### Authentication & Database
- **Supabase**: Primary authentication, real-time subscriptions, and PostgreSQL integration.
- **Neon Database**: Alternative PostgreSQL provider.
- **Postgres**: Direct PostgreSQL connection capabilities (fallback).

### UI Component Libraries
- **Radix UI**: Accessible UI primitives.
- **Shadcn/ui**: Pre-styled components built on Radix UI and Tailwind CSS.
- **Lucide React**: Icon library.

### State Management & Data Fetching
- **TanStack Query**: Server state management, caching, and refetching.
- **React Hook Form**: Form state management with Zod validation.

### Styling & Design
- **Tailwind CSS**: Utility-first CSS framework.
- **Framer Motion**: Animation library.
- **Class Variance Authority**: Type-safe variant styling.

### Development Tools
- **Vite**: Fast build tool and dev server.
- **TypeScript**: Type safety across the stack.
- **Drizzle ORM**: Type-safe SQL query builder and schema management.
- **ESLint & Prettier**: Code quality and formatting.

### Third-Party Services
- **Replit Infrastructure**: Hosting.
- **WebSocket Server**: Built-in `ws` package for real-time communication.
- **Google Fonts**: For typography.
- **DiceBear Avatars**: For user avatars.

### Build & Deployment
- **tsx**: TypeScript execution for the dev server.
- **Drizzle Kit**: Database migration tool.