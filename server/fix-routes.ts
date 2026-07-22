/**
 * server/fix-routes.ts
 * Route aggregation — exports registerRoutes and registerLiveChatRoutes
 * so server/index.ts can wire all routes.
 */
import { Express } from 'express';
import { setupCustomerRoutes } from './routes-customer';
import { setupTransferRoutes } from './routes-transfer';
import { setupAdminExtraRoutes } from './routes-admin-extra';
import { setupAdminExtra2Routes } from './routes-admin-extra2';
import { getChatHistory, getActiveSessions, createTicketFromChat } from './supabase-live-chat';
import { AuthenticatedRequest } from './auth-middleware';
import { Response } from 'express';

export function registerRoutes(app: Express) {
  setupCustomerRoutes(app);
  setupTransferRoutes(app);
  setupAdminExtraRoutes(app);
  setupAdminExtra2Routes(app);
}

export function registerLiveChatRoutes(app: Express) {
  app.get('/api/chat/history', async (req: AuthenticatedRequest, res: Response) => {
    return getChatHistory(req, res);
  });
  app.get('/api/chat/active-sessions', async (req: AuthenticatedRequest, res: Response) => {
    return getActiveSessions(req, res);
  });
  app.post('/api/chat/create-ticket', async (req: AuthenticatedRequest, res: Response) => {
    return createTicketFromChat(req, res);
  });
}
