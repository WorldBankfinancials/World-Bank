# Architecture

## Overview

The World Bank platform uses a **Hybrid Enterprise Monorepo** pattern combining modular monolith, DDD, clean architecture, and microservice-ready design.

## Architectural Layers

### apps/
Deployable applications that users and staff interact with directly.
- `web/` - Customer-facing banking website (React + Vite)

### services/
Independently deployable backend services.
- `api-server/` - Main Express API server with domain-based route modules

### domains/
Pure business domains following DDD principles. Contains business rules, entities, and domain logic independent of frameworks.

### modules/
Modular monolith features used by applications. These are application-level features that compose domain logic into user-facing functionality.

### packages/
Shared libraries used across apps and services.
- `shared/` - Schema definitions, types, and validation (Drizzle + Zod)

### platform/
Platform runtime infrastructure including bootstrap, dependency injection, health checks, and observability.

### integrations/
Adapters for external banking networks (SWIFT, SEPA, ACH), payment gateways, card networks, identity providers, and more.

### database/
Database schema, migrations, RLS policies, functions, procedures, triggers, and seeds.

### security/
Security architecture including encryption, JWT, RBAC, certificates, and compliance.

## Data Flow

1. Client (apps/web) sends request to API (services/api-server)
2. API route handler authenticates via middleware (auth-middleware)
3. Handler calls storage layer (IStorage interface)
4. Storage implementation (SupabasePublicStorage) queries Supabase
5. Response flows back through the handler to the client
6. Realtime updates pushed via Supabase Realtime channels

## Authentication Flow

1. Registration: POST /api/auth/register-complete -> Supabase Auth + local profile
2. Login: POST /api/auth/login -> Supabase Auth -> JWT -> localStorage
3. PIN verification: POST /api/verify-pin -> bcrypt compare
4. Protected routes: requireAuth middleware verifies JWT
5. Admin routes: requireAdmin middleware checks role = 'admin'
