# Fetch Audit

## Issues Found

### 1. Missing Authorization Headers
- Several fetch calls were missing the `Authorization: Bearer <token>` header
- Fixed by creating `authenticatedFetch` in `queryClient.ts`

### 2. Inconsistent Error Handling
- Some fetch calls had no error handling at all
- Some swallowed errors silently
- Fixed by adding centralized error handling in `throwIfResNotOk`

### 3. Missing Timeouts
- Fetch calls had no timeout, causing requests to hang indefinitely
- Fixed by adding `AbortController` with 10-second timeout

### 4. Missing Credentials
- Some fetch calls were missing `credentials: 'include'`
- Fixed by adding to all authenticated fetch calls
