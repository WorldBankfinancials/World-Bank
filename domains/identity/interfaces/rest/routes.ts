/**
 * Identity Domain - REST Routes
 *
 * Re-exports identity and user-profile route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/user
 *   GET    /api/profile
 *   GET    /api/user/profile
 *   GET    /api/user/preferences
 *   POST   /api/user/change-pin
 *   POST   /api/user/change-password
 *   GET    /api/user/activity-log
 *   GET    /api/user/trusted-devices
 *   POST   /api/verify-pin
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
