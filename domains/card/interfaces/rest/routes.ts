/**
 * Card Domain - REST Routes
 *
 * Re-exports card-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/cards
 *   GET    /api/cards/:id
 *   POST   /api/cards/lock
 *   PATCH  /api/cards/settings
 *   GET    /api/card-transactions
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
