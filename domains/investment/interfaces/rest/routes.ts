/**
 * Investment Domain - REST Routes
 *
 * Re-exports investment-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/investments
 *   GET    /api/investments/:id
 *   GET    /api/market-rates
 *   GET    /api/market-indices
 *   GET    /api/top-stocks
 *   GET    /api/portfolio-assets
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
