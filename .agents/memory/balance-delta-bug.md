---
name: Balance delta bug pattern
description: updateUserBalance() in supabase-public-storage.ts is a DELTA function — common mistake is passing absolute new balance instead.
---

# Balance Delta Bug Pattern

## The Rule
`storage.updateUserBalance(id, amount)` adds `amount` to the current balance (it is a DELTA function, not a setter).

**Why:** The implementation in `supabase-public-storage.ts` does `currentBalance + delta` internally using an atomic SQL update.

## How to Apply
- To deduct: pass `-numAmount` (negative delta)
- To credit: pass `+numAmount` (positive delta)
- To reverse a rejected transfer: pass `+numAmount` (refund)
- NEVER pass `newBalance = currentBalance ± amount` — that causes double-counting

## Files fixed (as of 2026-06)
- `server/routes-transfer.ts` — both /api/transfers and /api/international-transfers deduction calls
- `server/routes-transfer.ts` — both admin reject/reversal calls
- `server/fix-routes.ts` — /api/add-funds credit call
- Admin balance update at line 792 and 699 already used delta correctly
