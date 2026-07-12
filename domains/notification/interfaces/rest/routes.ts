/**
 * Notification Domain - REST Routes
 *
 * Re-exports notification and messaging route handlers from the central fix-routes.ts.
 *
 * Corresponding routes in fix-routes.ts:
 *   GET    /api/alerts
 *   GET    /api/alerts/unread
 *   POST   /api/alerts
 *   DELETE /api/alerts/:id
 *   PATCH  /api/alerts/:id/read
 *   GET    /api/messages
 *   GET    /api/messages/user/:userId
 *   POST   /api/messages
 *   GET    /api/messages/session/:sessionId
 *   PATCH  /api/messages/:id/read
 *   GET    /api/admin/chat-sessions
 *   GET    /api/chat/history
 *   GET    /api/chat/sessions
 *   POST   /api/chat/create-ticket
 *   POST   /api/chat/send
 *   POST   /api/chat/notify
 */

import { registerFixedRoutes } from '../../../../services/api-server/fix-routes';

export { registerFixedRoutes };

export default registerFixedRoutes;
