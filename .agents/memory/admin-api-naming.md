---
name: Admin API field naming
description: Key field name mismatches between frontend and backend for admin operations
---

# Admin API Field Naming Rules

**Profile photo upload** (`POST /api/admin/customers/:id/profile-picture`):
- Server expects JSON body: `{ profilePhoto: "<base64 string>" }`
- NOT FormData. NOT `avatarUrl`. NOT `profilePic`.
- Must convert File → base64 (FileReader) before sending.

**Transaction creation** (`POST /api/admin/transactions`):
- Server expects `{ accountId, amount, description, type }`
- NOT `fromAccountId` — that was the bug.

**Why:** Backend was written with specific field names; frontend had multiple inconsistencies where field names didn't match what the server validated, causing silent 400 errors.

**How to apply:** When adding admin API calls, always cross-reference the exact destructuring in the route handler in `server/fix-routes.ts`.
