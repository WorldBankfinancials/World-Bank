/**
 * Transfer Domain - REST Routes
 *
 * Re-exports transfer-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   POST   /api/transfers
 *   PATCH  /api/transfers/:id/status
 *   POST   /api/add-funds
 *   POST   /api/international-transfers
 *   GET    /api/admin/pending-transfers
 *   POST   /api/admin/transfers/:id/approve
 *   POST   /api/admin/transfers/:id/reject
 */

export { registerFixedRoutes } from '../../../../server/fix-routes';

export default { registerFixedRoutes };
