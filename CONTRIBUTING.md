# Contributing to the Enterprise Banking Platform

Thank you for your interest in contributing to the enterprise banking platform! This document provides guidelines and instructions for contributing.

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **pnpm** 8+ (package manager)
- **Git**
- **Supabase CLI** (for database operations)

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd project
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

4. Configure your `.env` file with the required values (see `.env.example` for reference).

5. Start the development server:
   ```bash
   pnpm turbo dev
   ```

## Monorepo Structure

This is a pnpm workspace monorepo managed by Turborepo:

- **`apps/`** — User-facing applications (web, mobile)
- **`domains/`** — Business domain modules (34 domains)
- **`services/`** — Microservices (16 services)
- **`packages/`** — Shared libraries (38 packages)
- **`platform/`** — Platform-level infrastructure
- **`integrations/`** — External system integrations
- **`infrastructure/`** — Deployment infrastructure
- **`database/`** — Database schema and migrations

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Use the following branch naming conventions:
- `feature/` — New features
- `fix/` — Bug fixes
- `refactor/` — Code refactoring
- `docs/` — Documentation changes
- `chore/` — Maintenance tasks

### 2. Make Your Changes

Follow the coding standards:
- Use TypeScript for all new code
- Follow the existing ESLint and Prettier configurations
- Write meaningful commit messages (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Run Quality Checks

```bash
# Lint
pnpm turbo lint

# Type check
pnpm turbo build

# Run tests
pnpm turbo test
```

### 4. Commit Your Changes

We follow conventional commits:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types:
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation
- `style` — Formatting, no code change
- `refactor` — Code refactoring
- `test` — Adding tests
- `chore` — Maintenance

Example:
```
feat(transfer): add international transfer support

Add support for SWIFT international transfers with
compliance checks and exchange rate conversion.

Closes #123
```

### 5. Push and Create a Pull Request

```bash
git push origin feature/your-feature-name
```

Create a pull request with:
- A clear title and description
- Reference to any related issues
- Screenshots for UI changes
- Test results

## Domain-Driven Design Guidelines

When working within a domain:

1. **Respect domain boundaries** — Don't import from another domain's internal modules; use the domain's public API (`index.ts`)
2. **Follow the layered structure**:
   - `domain/` — Pure business logic, no external dependencies
   - `application/` — Use cases that orchestrate domain logic
   - `infrastructure/` — Technical implementation details
   - `interfaces/` — API endpoints and external interfaces
3. **Use meaningful names** — Name files and functions after their business purpose
4. **Keep domain logic pure** — Domain entities should not depend on frameworks or infrastructure

## Database Migrations

When making database changes:

1. Create a new migration file:
   ```bash
   supabase migration new descriptive_name
   ```

2. Write your migration SQL in the generated file under `supabase/migrations/`

3. Copy the migration to the database directory:
   ```bash
   cp supabase/migrations/<new_file>.sql database/migrations/
   ```

4. Test the migration locally:
   ```bash
   supabase db reset
   ```

5. Ensure RLS policies are included for any new tables

## Testing

- Write unit tests for domain logic
- Write integration tests for API endpoints
- Write e2e tests for critical user flows
- Aim for meaningful coverage, not just percentage targets

```bash
# Run all tests
pnpm turbo test

# Run tests for a specific package
pnpm --filter @project/packages/database test
```

## Code Review

All pull requests require review before merging:

1. Self-review your changes before requesting review
2. Address review feedback promptly
3. Keep PRs focused — one feature or fix per PR
4. Use the PR template for consistency

## Release Process

1. Releases are tagged using semantic versioning: `vMAJOR.MINOR.PATCH`
2. A release candidate is created and tested in staging
3. After approval, the release is deployed to production
4. Release notes are generated from the commit history

## Questions?

- Open an issue for bugs or feature requests
- Check existing documentation in `docs/`
- Review the [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
- Review the [SECURITY.md](./SECURITY.md) for security practices

Thank you for contributing!
