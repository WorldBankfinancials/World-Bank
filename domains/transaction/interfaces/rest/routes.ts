/**
 * Transaction Domain - REST Routes
 *
 * Re-exports transaction-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/transactions
 *   GET    /api/transactions/recent
 *   POST   /api/transactions/:id/reverse
 *   GET    /api/admin/transactions
 *   GET    /api/admin/transactions/:id
 *   POST   /api/admin/create-transaction
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
