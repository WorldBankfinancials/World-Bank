/**
 * Statement Domain - REST Routes
 *
 * Re-exports statement-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/statements
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
