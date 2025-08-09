// Real-time API routes for World Bank hybrid system
// Handles Supabase integration while maintaining your existing structure

import type { Express } from "express";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || 'https://sgxmfpirkjlomzfaqqzr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNneG1mcGlya2psb216ZmFxcXpyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODk3MzQzMiwiZXhwIjoyMDY0NTQ5NDMyfQ.REHVKmYEUyMmbMH2JaLOA7Cl_oZKIGm3KYG-Kfgzjjs';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export function setupRealtimeRoutes(app: Express) {
  
  // Send real-time alert to user (admin function)
  app.post('/api/realtime/alerts/send', async (req, res) => {
    try {
      const { userId, title, message, type = 'info' } = req.body;
      
      if (!userId || !title || !message) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { error } = await supabase
        .from('alerts')
        .insert({
          user_id: userId,
          title,
          message,
          type
        });

      if (error) {
        console.error('Supabase alert error:', error);
        return res.status(500).json({ error: 'Failed to send alert' });
      }

      res.json({ success: true, message: 'Alert sent successfully' });
    } catch (error) {
      console.error('Send alert error:', error);
      res.status(500).json({ error: 'Failed to send alert' });
    }
  });

  // Get user's real-time alerts
  app.get('/api/realtime/alerts/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Supabase alerts fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch alerts' });
      }

      // Transform to your existing format
      const alerts = data.map(alert => ({
        id: alert.id,
        userId: alert.user_id,
        title: alert.title,
        message: alert.message,
        type: alert.type,
        isRead: alert.is_read,
        timestamp: alert.created_at
      }));

      res.json(alerts);
    } catch (error) {
      console.error('Get alerts error:', error);
      res.status(500).json({ error: 'Failed to fetch alerts' });
    }
  });

  // Send real-time chat message
  app.post('/api/realtime/chat/send', async (req, res) => {
    try {
      const { senderId, recipientId, content, senderRole = 'customer', senderName } = req.body;
      
      if (!senderId || !content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: senderId,
          recipient_id: recipientId,
          content,
          sender_role: senderRole,
          sender_name: senderName || (senderRole === 'admin' ? 'World Bank Support' : 'Customer')
        });

      if (error) {
        console.error('Supabase message error:', error);
        return res.status(500).json({ error: 'Failed to send message' });
      }

      res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // Get real-time chat history
  app.get('/api/realtime/chat/:userId', async (req, res) => {
    try {
      const { userId } = req.params;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Supabase messages fetch error:', error);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

      // Transform to your existing format
      const messages = data.map(msg => ({
        id: msg.id,
        senderId: msg.sender_id,
        recipientId: msg.recipient_id,
        senderName: msg.sender_name,
        senderRole: msg.sender_role,
        message: msg.content,
        timestamp: msg.created_at,
        isRead: msg.is_read
      }));

      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  // Create real-time transaction (hybrid with your existing system)
  app.post('/api/realtime/transactions/create', async (req, res) => {
    try {
      const { userId, amount, type, description, recipientAccount } = req.body;
      
      if (!userId || !amount || !type || !description) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { error } = await supabase
        .from('live_transactions')
        .insert({
          user_id: userId,
          amount,
          type,
          description,
          recipient_account: recipientAccount,
          status: 'pending'
        });

      if (error) {
        console.error('Supabase transaction error:', error);
        return res.status(500).json({ error: 'Failed to create transaction' });
      }

      res.json({ success: true, message: 'Transaction created successfully' });
    } catch (error) {
      console.error('Create transaction error:', error);
      res.status(500).json({ error: 'Failed to create transaction' });
    }
  });

  // Admin: Send banking alert to specific user
  app.post('/api/admin/send-alert', async (req, res) => {
    try {
      const { targetUserId, title, message, type = 'info' } = req.body;
      
      // In a real application, you'd check admin permissions here
      
      const { error } = await supabase
        .from('alerts')
        .insert({
          user_id: targetUserId,
          title,
          message,
          type
        });

      if (error) {
        console.error('Admin alert error:', error);
        return res.status(500).json({ error: 'Failed to send alert' });
      }

      res.json({ success: true, message: 'Banking alert sent successfully' });
    } catch (error) {
      console.error('Admin send alert error:', error);
      res.status(500).json({ error: 'Failed to send alert' });
    }
  });

  // Test endpoint to verify Supabase connection
  app.get('/api/realtime/health', async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('count')
        .limit(1);

      if (error) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Supabase connection failed',
          error: error.message 
        });
      }

      res.json({ 
        status: 'healthy', 
        message: 'Supabase Realtime connection active',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: 'Health check failed',
        error: (error as Error).message
      });
    }
  });
}