---
name: Supabase GET method mapping
description: mapTransaction, mapMessage, mapAdminAction mapper functions needed for all get* methods in supabase-public-storage.ts
---

## Rule
All `get*` methods in `supabase-public-storage.ts` that return transaction, message, or admin action rows must apply the corresponding mapper function. The DB returns snake_case; TypeScript types use camelCase.

## Mappers added (before withRetry, after mapUser)
- `mapTransaction` — maps from_account_id→fromAccountId, to_account_id→toAccountId, from_user_id→fromUserId, reference_number→referenceNumber, etc.
- `mapMessage` — maps sender_id→senderId, sender_role→senderRole, recipient_id→recipientId, is_read→isRead, session_id→sessionId
- `mapAdminAction` — maps admin_id→adminId, target_id→targetId, target_type→targetType

## Applied in
- `getAllTransactions` → `.map(mapTransaction)`
- `getPendingTransactions` → `.map(mapTransaction)`
- `getMessages` → `.map(mapMessage)`
- `getUserMessages` → `.map(mapMessage)`
- `getAdminActions` → `.map(mapAdminAction)`

**Why:** Supabase REST API returns raw snake_case DB column names. All `create*` methods already had explicit snake_case→camelCase mappings for inserts, but the corresponding `get*` methods returned raw rows causing undefined fields on the frontend.
