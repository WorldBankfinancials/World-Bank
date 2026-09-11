---
name: Realtime subscription patterns
description: Supabase realtime subscriptions must clean up on unmount; transaction hooks must subscribe to both from_ and to_ user filters
---

## Rules
1. Always return `channel.unsubscribe()` in the useEffect cleanup function.
2. For transaction realtime hooks, subscribe to BOTH `from_user_id=eq.${userId}` AND `to_user_id=eq.${userId}` so users see incoming AND outgoing transaction updates.

## Fixed in
- `useRealtimeTransactions.ts` — added second `.on()` subscription for `to_user_id`

**Why:** Without the `to_user_id` filter, recipients never see real-time updates for money sent to them. Without cleanup, subscriptions leak across component lifecycles.
