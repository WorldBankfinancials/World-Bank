# Enterprise Banking Platform Architecture

## Overview

This document describes the architecture of the enterprise banking platform, a modular, domain-driven system built for retail and commercial banking operations. The platform is designed with security, scalability, and regulatory compliance as first-class concerns.

## Design Principles

### Domain-Driven Design (DDD)

The platform is organized around business domains rather than technical layers. Each domain is a self-contained bounded context with its own:

- **Domain layer** — Entities, aggregates, value objects, domain events, and business rules
- **Application layer** — Use cases, command/query handlers, DTOs, and orchestration
- **Infrastructure layer** — Database persistence, external API adapters, messaging, caching
- **Interfaces layer** — REST API, GraphQL, gRPC, WebSocket endpoints, and event consumers

### Hexagonal Architecture (Ports & Adapters)

Each domain exposes ports (interfaces) that the application layer depends on, with adapters implemented in the infrastructure layer. This allows swapping persistence, messaging, or external service implementations without touching domain logic.

### Microservices-Ready

The platform is structured as a monorepo with clear service boundaries. Each service can be deployed independently. The domain structure allows extracting any domain into its own microservice with minimal refactoring.

## Directory Structure

```
project/
├── apps/                    # User-facing applications
│   └── web/                 # Web application (React/TypeScript)
├── domains/                 # Business domains (34 domains)
│   ├── account/             # Account management
│   ├── authentication/      # Auth & session management
│   ├── card/                # Card management
│   ├── customer/            # Customer management
│   ├── transaction/         # Transaction processing
│   ├── transfer/            # Money transfers
│   ├── ...                  # 28 more domains
│   └── workflow/            # Workflow & case management
├── services/                # Microservices (16 services)
│   ├── api-server/          # Central API server
│   ├── auth-service/        # Authentication service
│   ├── payment-service/     # Payment processing service
│   └── ...                  # 13 more services
├── packages/                # Shared libraries (38 packages)
│   ├── database/            # Database utilities
│   ├── encryption/          # Encryption utilities
│   ├── jwt/                 # JWT utilities
│   ├── logging/             # Logging utilities
│   └── ...                  # 34 more packages
├── platform/                # Platform infrastructure
│   ├── bootstrap/           # Application bootstrap
│   ├── configuration/       # Configuration management
│   ├── health/              # Health checks
│   └── ...                  # Observability, DI, runtime
├── integrations/            # External system integrations
│   ├── ach/                 # ACH network
│   ├── swift/               # SWIFT messaging
│   ├── sepa/                # SEPA payments
│   └── ...                  # 15 more integrations
├── infrastructure/          # Deployment infrastructure
│   ├── docker/              # Docker configurations
│   ├── kubernetes/          # K8s manifests
│   ├── terraform/           # Infrastructure as code
│   └── ...                  # 15 more infra components
├── database/                # Database schema & migrations
│   ├── migrations/          # SQL migration files
│   ├── schema/              # Schema documentation
│   └── ...                  # Seeds, indexes, triggers, views
├── ai/                      # AI/ML models and training
├── security/                # Security policies and tooling
├── docs/                    # Documentation
├── scripts/                 # Utility scripts
├── tests/                   # Test suites
├── tools/                   # Development tools
├── configs/                 # Configuration files
└── assets/                  # Static assets
```

## Domain Catalog

The platform is organized into 34 business domains:

| Domain | Description |
|--------|-------------|
| account | Bank account management |
| administration | Administrative operations |
| aml | Anti-money laundering |
| analytics | Data analytics & BI |
| audit | Audit trail management |
| authentication | User authentication |
| beneficiary | Payment beneficiaries |
| billing | Billing operations |
| card | Card management |
| compliance | Regulatory compliance |
| customer | Customer management |
| document | Document management |
| exchange-rate | Currency exchange rates |
| forex | Foreign exchange |
| fraud | Fraud detection |
| identity | Identity & access |
| investment | Investment portfolios |
| invoice | Invoice management |
| kyc | KYC verification |
| ledger | General ledger |
| loan | Loan management |
| notification | Notifications & messaging |
| payment | Payment processing |
| reconciliation | Reconciliation |
| reporting | Reporting & analytics |
| risk | Risk management |
| savings | Savings accounts |
| settlement | Settlement operations |
| statement | Account statements |
| transaction | Transaction management |
| transfer | Money transfers |
| treasury | Treasury management |
| wallet | Digital wallet |
| workflow | Workflow & case management |

## Service Catalog

The platform includes 16 microservices:

| Service | Description |
|---------|-------------|
| api-server | Central API server (Express.js) |
| account-service | Account management service |
| auth-service | Authentication service |
| aml-service | AML monitoring service |
| analytics-service | Analytics service |
| fraud-service | Fraud detection service |
| kyc-service | KYC verification service |
| ledger-service | Ledger service |
| notification-service | Notification service |
| payment-service | Payment processing service |
| reporting-service | Reporting service |
| risk-service | Risk management service |
| scheduler-service | Job scheduler service |
| search-service | Search service |
| transfer-service | Transfer service |
| workflow-service | Workflow service |

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Supabase Auth, JWT
- **Real-time**: WebSocket, Supabase Realtime
- **File Storage**: Supabase Storage
- **Build System**: Turborepo, pnpm workspaces
- **Containerization**: Docker, Kubernetes
- **Infrastructure**: Terraform, Helm

## API Design

### REST API

The primary API is REST-based, served by the `api-server` service. All endpoints are prefixed with `/api/`. Route handlers are currently centralized in `server/fix-routes.ts` and are being progressively reorganized into domain-specific route files under `domains/{domain}/interfaces/rest/routes.ts`.

### Authentication

Authentication is handled via Supabase Auth with JWT tokens. Protected routes require the `Authorization` header with a valid Bearer token. Admin routes additionally require an admin role.

### Rate Limiting

Rate limiting is applied to sensitive endpoints:
- Authentication endpoints (login, register)
- Transaction endpoints
- General API endpoints

## Security

Security is a cross-cutting concern addressed at every layer:

- **Row Level Security (RLS)** on all database tables
- **JWT-based authentication** with role-based access control
- **Input validation** on all API endpoints
- **Audit logging** for all administrative actions
- **Encryption** for sensitive data at rest and in transit
- **Rate limiting** to prevent abuse

See [SECURITY.md](./SECURITY.md) for detailed security practices.

## Build & Deployment

### Monorepo Management

The platform uses pnpm workspaces with Turborepo for build orchestration:

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm turbo build

# Run development
pnpm turbo dev

# Run tests
pnpm turbo test

# Lint
pnpm turbo lint
```

### Database Migrations

Migrations are managed via Supabase and stored in `database/migrations/`:

```bash
# Apply migrations
supabase db push

# Create a new migration
supabase migration new <name>
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.
