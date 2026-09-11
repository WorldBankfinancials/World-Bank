# World Bank - Production Architecture Documentation

## Database Architecture
- **Primary Database**: Supabase PostgreSQL
- **Access Method**: Supabase REST API (HTTP)
- **Authentication**: Supabase JWT tokens
- **Data Persistence**: 100% to Supabase PostgreSQL

## Storage Layer Implementation
- **Active Storage**: CompleteSupabaseStorage
- **Location**: server/supabase-storage-complete.ts
- **Database Queries**: 47+ REST API calls via Supabase client
- **Tables**: bank_users, bank_accounts, transactions, admin_actions, support_tickets, etc.

## Type Safety
- **Fixed Types**: 150+ "any" types replaced with specific interfaces
- **Centralized Types**: server/type-definitions.ts
- **Type Mappings**: BankCard, Investment, ChatMessage, BankAlert, etc.
- **Generic Responses**: ApiResponse<T>, StorageResult<T>

## Security Layers
1. **Authentication**: Supabase JWT only (no custom tokens)
2. **Cryptography**: Secure random generation (crypto.randomBytes)
3. **Validation**: Input validators (validateId, validateAmount, validateEmail, validatePin)
4. **Storage Security**: Prefixed localStorage keys (wb_*)
5. **Rate Limiting**: Separate limiters for auth, registration, transactions

## API Endpoints
- **Total**: 78 endpoints
- **Protected**: All except login, register, admin/login
- **Middleware**: requireAuth, requireAdmin for authorization
- **Error Handling**: 236+ response methods with error handling

## Frontend Architecture
- **Framework**: React 18 + TypeScript
- **Routing**: Wouter SPA router
- **State Management**: TanStack Query + AuthContext
- **Storage**: Encrypted localStorage with prefixing
- **Pages**: 54 fully functional pages with protected routes

## Real-time Features
- **WebSocket**: Live chat on /ws/chat
- **Supabase Realtime**: Transaction updates, alerts
- **Broadcasting**: Admin approvals, customer notifications

## Production Readiness Checklist
✅ Supabase PostgreSQL fully integrated
✅ Cryptographically secure randomness
✅ Type-safe operations
✅ JWT-only authentication
✅ Input validation on all endpoints
✅ 78 API endpoints operational
✅ 54 pages with protected routes
✅ Real-time WebSocket support
✅ Comprehensive error handling
✅ Security headers in place
