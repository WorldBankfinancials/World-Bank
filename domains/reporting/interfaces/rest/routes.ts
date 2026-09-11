/**
 * Reporting Domain - REST Routes
 *
 * Re-exports reporting and analytics route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/admin/stats
 *   GET    /api/admin/transaction-routes
 *   GET    /api/admin/transaction-routes/:id
 *   POST   /api/admin/transaction-routes
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
