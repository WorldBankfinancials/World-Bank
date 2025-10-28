# World Bank Digital Banking Platform

## Overview

The World Bank Digital Banking Platform is a full-stack application providing secure international banking services. It enables customers to manage accounts, transfer funds globally, track investments, and access real-time support. Administrators are equipped with tools for customer management, transaction oversight, and system monitoring. The platform aims to deliver a modern, comprehensive banking experience with robust security and real-time capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

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