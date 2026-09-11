/**
 * Authentication Domain - REST Routes
 *
 * Re-exports authentication-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   POST   /api/auth/register
 *   POST   /api/auth/register-complete
 *   GET    /api/auth/check-email
 *   POST   /api/auth/login
 *   POST   /api/auth/logout
 *   GET    /api/users/supabase/:supabaseId
 *   POST   /api/admin/reset-user-password
 *   POST   /api/admin/create-admin-user
 *   POST   /api/admin/login
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
