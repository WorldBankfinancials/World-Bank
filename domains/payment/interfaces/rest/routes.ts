/**
 * Payment Domain - REST Routes
 *
 * Re-exports payment-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/payment-requests
 *   GET    /api/mobile-payments
 *   GET    /api/mobile-pay/merchants
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
