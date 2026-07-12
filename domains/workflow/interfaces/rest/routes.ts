/**
 * Workflow Domain - REST Routes
 *
 * Re-exports workflow and support-ticket route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/support-tickets
 *   POST   /api/support-tickets
 *   GET    /api/support-tickets/:id
 *   GET    /api/admin/support-tickets
 *   GET    /api/admin/support-tickets/:id
 *   POST   /api/admin/tickets/:id/respond
 */

export { registerFixedRoutes } from '../../../../server/fix-routes';

export default { registerFixedRoutes };
