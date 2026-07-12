/**
 * Statement Domain - REST Routes
 *
 * Re-exports statement-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/statements
 */

export { registerFixedRoutes } from '../../../../server/fix-routes';

export default { registerFixedRoutes };
