/**
 * Exchange Rate Domain - REST Routes
 *
 * Re-exports exchange-rate-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/exchange-rates
 *   GET    /api/currency-exchange
 *   GET    /api/currencies
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
