---
name: React render-phase side effects
description: toast() and other side effects must never be called directly in the render body; always wrap in useEffect
---

## Rule
Never call `toast()`, `navigate()`, or any other side-effect function directly in the render body (outside of event handlers or useEffect). This causes infinite re-render loops and duplicate notifications.

## Bad pattern (found in useQueryError.ts and useQueryWithError.ts)
```ts
if (result.isError) {
  toast({ title: 'Error', description: ... }); // WRONG — called every render
}
```

## Correct pattern
```ts
useEffect(() => {
  if (result.isError && result.error) {
    toast({ title: 'Error', description: ... });
  }
}, [result.isError, result.error]);
```

**Why:** React renders are pure — side effects must be isolated in useEffect or event handlers. Calling toast in render fires a new toast on every re-render while in error state.
