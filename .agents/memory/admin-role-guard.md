---
name: Admin role guard pattern
description: Every admin page component needs both a useEffect redirect AND a render guard to block non-admin users
---

## Rule
Admin-only pages need TWO layers of protection to prevent non-admins from seeing content:

1. **useEffect redirect** — fires when auth state resolves, redirects to `/login` with a toast
2. **Render guard** — `if (userProfile && userProfile.role !== 'admin') return null;` placed before any loading spinners

**Why:** The useEffect runs asynchronously after render. Without the render guard, the page briefly renders for non-admins before the redirect fires. With only the render guard, users with no profile yet (loading state) see a blank screen instead of a spinner.

**How to apply:**
```typescript
const { user, userProfile, loading: authLoading } = useAuth();

useEffect(() => {
  if (authLoading) return;
  const storedProfile = localStorage.getItem('userProfile');
  const profile = storedProfile ? JSON.parse(storedProfile) : null;
  const role = profile?.role || userProfile?.role;
  if (role && role !== 'admin') {
    toast({ title: 'Access Denied', description: 'Admin role required.', variant: 'destructive' });
    setLocation('/login');
  }
}, [user, userProfile, authLoading]);

// Then before loading spinners:
if (userProfile && userProfile.role !== 'admin') return null;
```

Pages that have this pattern: `admin-panel.tsx`, `admin-dashboard.tsx`.
