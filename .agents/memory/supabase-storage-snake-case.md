---
name: Supabase storage snake_case mapping
description: All storage create* methods must map camelCase Drizzle InsertX types to snake_case before calling supabase.from().insert()
---

## Rule
When calling `supabase.from('table').insert(data)`, the Supabase REST client sends JSON field names as-is. Drizzle ORM `InsertX` types use camelCase JS property names (`senderId`, `userId`, `isRead`), but the actual DB columns are snake_case (`sender_id`, `user_id`, `is_read`). Passing `data as any` silently stores nothing for the mismatched fields.

**Why:** The Supabase JS client does NOT apply Drizzle's column mappings — it serializes the object directly to JSON for the PostgREST API.

**How to apply:** Every `create*` method in `supabase-public-storage.ts` must build an explicit `row` object that maps camelCase to snake_case before the insert call. Methods fixed: `createMessage`, `createAlert`, `createInvestment`, `createCard`, `createAdminAction`. Method already correct: `createTransaction`, `createAccount`.

**Pattern:**
```typescript
const row = {
  user_id: (data as any).userId ?? (data as any).user_id,
  is_read: (data as any).isRead ?? false,
  // ... all other fields
};
await supabase.from('table').insert(row).select().single();
```
