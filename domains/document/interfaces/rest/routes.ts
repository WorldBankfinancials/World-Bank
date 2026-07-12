/**
 * Document Domain - REST Routes
 *
 * Re-exports document and file-upload route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   POST   /api/objects/upload
 *   POST   /api/user/upload-avatar
 *   POST   /api/admin/users/:id/profile-photo
 *   POST   /api/admin/customers/:id/profile-picture
 */

export { registerFixedRoutes } from '../../../../server/fix-routes';

export default { registerFixedRoutes };
