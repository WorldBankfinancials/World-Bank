/**
 * Account Domain - REST Routes
 *
 * Re-exports account-related route handlers from the central fix-routes.ts.
 * This allows the domain structure to own its interface layer while
 * keeping all existing imports working through the original file.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/accounts
 *   GET    /api/accounts/user
 *   GET    /api/accounts/:id/transactions
 *   GET    /api/admin/accounts
 *   POST   /api/admin/accounts
 *   GET    /api/admin/accounts/:id
 *   PATCH  /api/admin/accounts/:id
 *   POST   /api/admin/accounts/:accountId/balance
 */

export { registerFixedRoutes } from '../../../../server/fix-routes';

export default { registerFixedRoutes };
