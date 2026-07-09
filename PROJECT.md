# PROJECT.md — World Bank Digital Banking
## The Digital Constitution & Agent Operating Rules

### Primary Directive

This application is built and maintained exclusively by AI agents for a non-technical product manager working on an iPhone browser. The product manager cannot write, edit, or debug code. All agents must handle 100% of terminal commands, code modifications, file creation, testing, linting, formatting, circuit breakers, retry queues, and workspace modifications autonomously as a modular monolith/monorepo running on React, Node/Express, and Supabase.

### Non-Negotiable Rules

1. **NEVER ask the user to manually write code** — If a change is needed, the agent makes it directly.
2. **NEVER ask the user to copy-paste text** — All file content is generated and written by agents.
3. **NEVER ask the user to run terminal commands** — The agent executes all commands.
4. **NEVER ask the user to debug errors** — The agent reads errors, diagnoses root causes, and fixes them.
5. **NEVER ask the user to install packages** — The agent handles all dependency management.
6. **NEVER ask the user to configure environment variables** — The agent reads existing .env and manages connections.

### The 6 Quality Gates

Every code change must pass all 6 gates before being merged:

1. **Type Gate** — `npx tsc --noEmit` passes with zero errors. No `any` types. All interfaces explicitly defined.
2. **Lint Gate** — `npm run lint` passes with zero warnings. ESLint rules enforced: no unused vars, no console.log in production, no empty catch blocks.
3. **Format Gate** — `npx prettier --check .` passes. All files formatted with 2-space indent, 100-char rulers, trailing newline.
4. **Build Gate** — `npm run build` succeeds. Vite production build completes without errors. Bundle size within limits.
5. **Security Gate** — No secrets in code. RLS enabled on all database tables. Input validation on all API endpoints. JWT signature verified.
6. **Test Gate** — New features include tests. All existing tests pass. No test coverage regression.

### User Profile

- **Role**: Non-technical product manager
- **Device**: iPhone browser (Safari/Chrome mobile)
- **Access**: Read-only review via Vercel Preview Links
- **Communication**: Plain language, no technical jargon, no code snippets in chat
- **Decision making**: Approves/rejects layouts and features via preview links

### Agent Responsibilities

| Task | Agent Handles | User Handles |
|------|--------------|--------------|
| Code writing | 100% | 0% |
| Terminal commands | 100% | 0% |
| Package installation | 100% | 0% |
| Database migrations | 100% | 0% |
| Git operations | 100% | 0% |
| Error debugging | 100% | 0% |
| Testing | 100% | 0% |
| Linting & formatting | 100% | 0% |
| Circuit breakers | 100% | 0% |
| Retry queues | 100% | 0% |
| Layout review | 0% | 100% |
| Feature approval | 0% | 100% |
| Production release | 0% | 100% |

### Branch Strategy

- **`main` branch**: Production-ready code only. Initial setup phase authorized direct push.
- **`development` branch**: All future work. Vercel auto-generates preview links for iPhone review.
- **Workflow**: `development` -> user reviews preview -> user approves -> merge to `main` -> production deploy

### Communication Standards

- Report outcomes in plain, non-technical language
- Focus on what was accomplished, not how it was implemented
- Never show code snippets, terminal output, or file paths in user-facing summaries
- Never ask the user to "check the console" or "look at the logs"
- If something fails, explain what went wrong in simple terms and what was done to fix it

### Design Standards

- Mobile-first, optimized for iPhone touchscreens
- Touch-friendly buttons (minimum 44px tap targets)
- Responsive charts that scale on small screens
- Clean, professional banking aesthetic (no purple/violet hues)
- Sufficient color contrast on all backgrounds
- Smooth animations and micro-interactions
- Bottom navigation for primary actions
