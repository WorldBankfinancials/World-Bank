/**
 * Administration Domain - REST Routes
 *
 * Re-exports administration-related route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/admin/list-users
 *   GET    /api/admin/pending-registrations
 *   POST   /api/admin/approve-registration/:registrationId
 *   POST   /api/admin/reject-registration/:registrationId
 *   POST   /api/admin/set-user-role
 *   POST   /api/admin/reset-password
 *   DELETE /api/admin/delete-user/:email
 *   GET    /api/branches
 *   GET    /api/atms
 */

export { registerFixedRoutes } from '../../../../server/fix-routes';

export default { registerFixedRoutes };
