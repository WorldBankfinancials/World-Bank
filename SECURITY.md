# Security Policy

## Overview

This document outlines the security practices and policies for the enterprise banking platform. Security is the highest priority for any financial system, and this platform implements defense-in-depth across all layers.

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it immediately:

1. **DO NOT** open a public GitHub issue
2. Email the security team at security@example.com
3. Include a detailed description of the vulnerability
4. Provide steps to reproduce if possible
5. Do not exploit the vulnerability beyond what is needed for demonstration

We will acknowledge receipt within 48 hours and provide a timeline for a fix.

## Authentication & Authorization

### Authentication

- **Supabase Auth** is used for user authentication with JWT tokens
- Passwords are hashed using bcrypt with a minimum cost factor of 10
- Session tokens have configurable expiration
- Multi-factor authentication (MFA) is supported
- Account lockout is enforced after failed login attempts

### Authorization

- **Role-Based Access Control (RBAC)** with roles: `user`, `admin`, `super_admin`
- **Row Level Security (RLS)** policies on all database tables ensure users can only access their own data
- Admin endpoints require admin role verification via middleware
- API keys and service role keys are never exposed to the client

### Session Management

- JWT tokens are signed with a secret key
- Tokens include expiration timestamps
- Refresh tokens are used for long-lived sessions
- Logout invalidates the session on both client and server

## Data Protection

### Encryption at Rest

- Database encryption is handled by Supabase/PostgreSQL
- Sensitive fields (PII, financial data) are encrypted at the application layer
- File storage uses encrypted buckets

### Encryption in Transit

- All API communication uses HTTPS/TLS
- Database connections use SSL
- WebSocket connections use WSS (WebSocket Secure)
- Minimum TLS version: 1.2

### PII Handling

- Personally Identifiable Information (PII) is stored with minimal scope
- Data retention policies are enforced
- Users can request data deletion (GDPR/CCPA compliance)
- PII is never logged in application logs

## Input Validation

- All API endpoints validate input using schema validation (Zod/Yup)
- SQL injection is prevented via parameterized queries (Supabase client)
- XSS is prevented via input sanitization and Content Security Policy
- File uploads are validated for type, size, and content
- Rate limiting prevents brute-force attacks

## Rate Limiting

Rate limiting is applied to all sensitive endpoints:

| Endpoint Category | Rate Limit |
|-------------------|------------|
| Authentication (login) | 5 requests per 15 minutes |
| Registration | 3 requests per hour |
| Transactions | 10 requests per minute |
| General API | 100 requests per minute |

Rate limits are configurable via environment variables.

## Audit & Compliance

### Audit Logging

- All administrative actions are logged in the `admin_actions` table
- User activity is tracked in `activity_logs`
- Transaction history is immutable and fully auditable
- Logs include: actor, action, timestamp, IP address, and affected resources

### Regulatory Compliance

- **AML (Anti-Money Laundering)**: Transaction monitoring and suspicious activity reporting
- **KYC (Know Your Customer)**: Identity verification before account activation
- **PCI DSS**: Card data handling follows PCI DSS guidelines
- **GDPR/CCPA**: Data privacy and user rights compliance
- **SOX**: Financial reporting controls and audit trails

## Infrastructure Security

### Secrets Management

- Secrets are stored in environment variables, never in code
- `.env` files are gitignored and never committed
- Production secrets are managed via a secrets manager
- Service role keys are only used server-side

### Network Security

- API gateway with IP allowlisting for admin endpoints
- Database access is restricted to application servers
- Internal service communication uses mTLS where applicable
- CORS is configured to only allow trusted origins

### Container Security

- Docker images are scanned for vulnerabilities
- Containers run as non-root users
- Container capabilities are minimized
- Images are pulled from trusted registries

## Security Headers

The API server sets the following security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`
- `Referrer-Policy: strict-origin-when-cross-origin`

## Dependency Security

- Dependencies are regularly updated to patch known vulnerabilities
- `npm audit` / `pnpm audit` is run in CI
- Dependabot is enabled for automated security updates
- Lockfiles are committed to ensure reproducible builds

## Incident Response

1. **Detection**: Automated alerts for suspicious activity
2. **Containment**: Affected accounts are locked; suspicious transactions are reversed
3. **Investigation**: Audit logs are reviewed; root cause is identified
4. **Remediation**: Vulnerability is patched; affected users are notified
5. **Post-Mortem**: Incident is documented; preventive measures are implemented
