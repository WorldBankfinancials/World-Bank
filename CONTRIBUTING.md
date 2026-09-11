# Contributing

## Development Setup

1. Clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in Supabase credentials
4. Run `npm run dev` to start the development server

## Code Style

- TypeScript strict mode
- ESLint + Prettier for formatting
- Follow existing patterns in the codebase
- Use the `@packages/shared` alias for shared schema/types

## Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following existing patterns
3. Ensure `npm run check` passes (TypeScript compilation)
4. Submit a pull request with a clear description

## Project Structure

See `ARCHITECTURE.md` for the full repository structure and design decisions.
