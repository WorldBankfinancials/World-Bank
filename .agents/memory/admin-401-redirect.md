---
name: Admin 401 redirect
description: Admin pages must redirect to /admin-login on 401, not /login; the queryClient had a single redirect hardcoded.
---

# Admin 401 Redirect

## The Rule
In `client/src/lib/queryClient.ts`, the global 401 handler must check `window.location.pathname` and redirect to `/admin-login` for admin routes, `/login` for all others.

**Why:** Admin login is at /admin-login. Sending admins to /login causes them to be redirected back with no way to log in.

## How to Apply
```typescript
if (window.location.pathname.startsWith('/admin')) {
  window.location.href = '/admin-login';
} else {
  window.location.href = '/login';
}
```
