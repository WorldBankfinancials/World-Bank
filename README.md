# World Bank - Enterprise Banking Platform

A high-grade, hybrid enterprise monorepo for a full-stack banking application built with Vite, React, Express, and Supabase.

## Architecture

This repository follows a **Hybrid Enterprise Monorepo** pattern combining:
- **Modular Monolith** - Single deployable application with modular internal structure
- **Domain-Driven Design (DDD)** - Pure business domains in `domains/`
- **Clean/Hexagonal Architecture** - Separation of concerns within each domain
- **Microservice-Ready** - Domains can be extracted into independent services in `services/`
- **Monorepo** - All code in one repository for easier development

## Repository Structure

```
banking-platform/
├── apps/                  # Deployable applications (web, admin, mobile)
├── services/              # Extractable microservices (api-server)
├── domains/               # Pure business domains (DDD)
├── modules/               # Modular monolith features
├── packages/              # Shared libraries (schema, types, ui)
├── platform/              # Core platform runtime
├── integrations/          # External providers and adapters
├── infrastructure/        # Cloud, DevOps, networking
├── database/              # Schema, migrations, policies
├── security/              # Security architecture
├── ai/                    # AI orchestration and agents
├── docs/                  # Documentation
├── scripts/               # Build and deployment scripts
├── tests/                 # Test suites
├── tools/                 # Development tools
├── configs/               # Shared configurations
└── assets/                # Static assets
```

## Technology Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend:** Express, Node.js, WebSocket
- **Database:** Supabase Postgres with RLS
- **Auth:** Supabase Auth + JWT
- **Realtime:** Supabase Realtime + WebSocket

## Getting Started

```bash
npm install
npm run dev
```

The server runs on port 5000 with Vite dev server for the frontend.

## License

MIT
