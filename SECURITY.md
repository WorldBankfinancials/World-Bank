# Security Policy

## Authentication
- Supabase Auth with JWT tokens
- bcrypt-hashed transfer PINs
- Role-based access control (customer, admin, support, compliance)
- CSRF token protection on state-changing requests

## Database Security
- Row Level Security (RLS) enabled on all tables
- Owner-scoped policies using auth.uid()
- Admin-only policies for sensitive operations

## API Security
- Rate limiting on auth and transaction endpoints
- CORS configured for allowed origins
- Security headers (CSP, X-Frame-Options, X-Content-Type-Options, HSTS)
- Input validation via Zod schemas

## Reporting Vulnerabilities
Please report security issues to the security team immediately.
