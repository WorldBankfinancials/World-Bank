/**
 * Wallet Domain - REST Routes
 *
 * Re-exports wallet-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/wallet-balance
 *   GET    /api/wallet-transactions
 */

export { registerFixedRoutes } from '../../../../server/fix-routes';

export default { registerFixedRoutes };
