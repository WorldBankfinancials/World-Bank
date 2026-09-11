/**
 * Customer Domain - REST Routes
 *
 * Re-exports customer-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/users
 *   GET    /api/users/:id
 *   GET    /api/admin/customers
 *   GET    /api/admin/customers/:id
 *   GET    /api/admin/customers-list
 *   PATCH  /api/admin/customers/:id/verify
 *   POST   /api/admin/customers/:id/profile-picture
 *   GET    /api/admin/customers/:id/balance
 *   PATCH  /api/admin/customers/:id
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
