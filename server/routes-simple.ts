import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";

export async function registerRoutes(app: Express): Promise<Server> {
  // Simple user endpoint that the frontend needs
  app.get('/api/user', async (req, res) => {
    try {
      // Check for Supabase user info in headers
      const supabaseEmail = req.headers['x-supabase-email'] as string;
      
      // Return user profile data based on authenticated email
      if (supabaseEmail) {
        const userProfile = {
          id: 'supabase-user-1',
          email: supabaseEmail,
          fullName: supabaseEmail.split('@')[0] || 'Banking Customer',
          role: 'customer',
          isVerified: true,
          isActive: true,
          isOnline: true,
          balance: 125000.50,
          accountNumber: '4389-7721-3456-9012',
          accountId: 'WB-2025-8901'
        };
        
        res.json(userProfile);
      } else {
        res.status(401).json({ error: 'Not authenticated' });
      }
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // WebSocket setup for real-time features
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws' 
  });

  wss.on('connection', (ws: WebSocket) => {
    console.log('🔗 New WebSocket connection established');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📨 WebSocket message received:', data);

        // Echo back or handle the message
        ws.send(JSON.stringify({
          type: 'response',
          data: { received: true, timestamp: new Date().toISOString() }
        }));
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'welcome',
      data: { message: 'Connected to World Bank WebSocket', timestamp: new Date().toISOString() }
    }));
  });

  return httpServer;
}