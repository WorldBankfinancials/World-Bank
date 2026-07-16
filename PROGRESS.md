# World Bank Fix Progress

## Session: 2026-07-16

### Completed Fixes (All Pushed to GitHub)

1. **`apps/web/src/lib/queryClient.ts`** - Token key mismatch fix
   - Changed `localStorage.getItem('accessToken')` to `localStorage.getItem('token')` (3 occurrences)
   - AuthContext stores token as `'token'`, not `'accessToken'`

2. **`server/storage-factory.ts`** - Multiple table/column reference fixes
   - Changed `user_profiles` to `users` table
   - Fixed `getAccountTransactions` to use `from_account_id OR to_account_id`
   - Fixed `getUserCards` to query via `account_id` using `.in()`
   - Fixed `getMessages` to use `ticket_id` instead of `conversation_id`
   - Fixed `markMessageAsRead` to use `is_read` instead of `read`
   - Fixed `markAlertAsRead` to set `is_read` and `read_at`
   - Changed `getExchangeRates` to use `forex` table instead of `exchange_rates`

3. **`apps/web/src/lib/supabase.ts`** - Session persistence fix
   - Changed `persistSession: false` to `true`
   - Changed `autoRefreshToken: false` to `true`
   - Added `detectSessionInUrl: true`

4. **`packages/shared/schema.ts`** - Empty file fix
   - Was 0 bytes, breaking all TypeScript imports
   - Populated with all type definitions (User, Account, Transaction, Card, etc.)

5. **`server/auth-middleware.ts`** - Comment fix
   - Updated comment from `user_profiles` to `users`

6. **`apps/web/src/pages/account-preferences.tsx`** - React Hooks violation fix
   - Moved `useState` and dependent `useEffect` before the conditional `if (isLoading) return`
   - Moved `isLoading` check after all hooks

7. **`apps/web/src/pages/admin-live-chat.tsx`** - Browser compatibility fixes
   - Replaced `require('@tanstack/react-query').useQueryClient?.()` with proper `useQueryClient` import
   - Removed optional chaining on `useRealtimeChat` hook call
   - Fixed `queryClient` naming conflict

8. **`apps/web/src/components/LiveChat.tsx`** - Type fix
   - Replaced `NodeJS.Timeout` with `ReturnType<typeof setTimeout>`

9. **`apps/web/src/hooks/useRealtimeChat.ts`** - Type fix
   - Replaced `NodeJS.Timeout` with `ReturnType<typeof setTimeout>`

10. **`apps/web/src/hooks/useRealtimeTransactions.ts`** - Type fix
    - Replaced `NodeJS.Timeout` with `ReturnType<typeof setTimeout>`

11. **`apps/web/src/pages/international-transfer.tsx`** - Type fix
    - Replaced `NodeJS.Timeout` with `ReturnType<typeof setTimeout>`

### Supabase Migrations Created

- `hash_transfer_pin` RPC function
- `verify_transfer_pin` RPC function
- `handle_new_auth_user` trigger update (auto-creates checking account on signup)

### Files Scanned (No Issues Found)

- `apps/web/src/pages/dashboard.tsx`
- `apps/web/src/pages/admin-dashboard.tsx`
- `apps/web/src/pages/cards.tsx`
- `apps/web/src/pages/login.tsx`
- `apps/web/src/pages/loans.tsx`
- `apps/web/src/pages/transaction-router.tsx`
- `apps/web/src/pages/pin-settings.tsx`
- `apps/web/src/pages/exchange.tsx`
- `apps/web/src/pages/investment.tsx`
- `apps/web/src/pages/transfer-funds.tsx`
- `apps/web/src/pages/register-multi-step.tsx`
- `apps/web/src/pages/verification.tsx`
- `apps/web/src/pages/digital-wallet.tsx`
- `apps/web/src/pages/credit-cards.tsx`
- `apps/web/src/pages/customer-management.tsx`
- `apps/web/src/pages/alerts.tsx`
- `apps/web/src/pages/history.tsx`
- `apps/web/src/components/Header.tsx`
- `apps/web/src/hooks/useSupabaseRealtimeDashboard.ts`

### Remaining Work

- Verify build compiles with all fixes
- Scan remaining smaller page files (about.tsx, add-money.tsx, receive.tsx, etc.)
- Check server/routes.ts for API endpoint correctness
- Test authentication flow end-to-end
- Test transfer flow end-to-end
- Test card management flow
