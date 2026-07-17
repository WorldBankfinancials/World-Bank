/**
 * SUPABASE REAL-TIME LIVE CHAT IMPLEMENTATION
 * WebSocket + Supabase Realtime for instant messaging
 */

import { Request, Response } from 'express';
import { supabase, getAdminClient } from './supabase-public-storage';
import { AuthenticatedRequest } from './auth-middleware';

// Get chat history for a user
export async function getChatHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    return res.json(data || []);
  } catch (error: unknown) {
    return res.status(500).json({ error: 'An internal error occurred' });
  }
}

// Get active chat sessions (admin only)
export async function getActiveSessions(req: AuthenticatedRequest, res: Response) {
  try {
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('messages')
      .select('sender_id, sender_role, message, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.json(data || []);
  } catch (error: unknown) {
    return res.status(500).json({ error: 'An internal error occurred' });
  }
}

// Create a support ticket from chat
export async function createTicketFromChat(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { subject, description, priority } = req.body;
    if (!subject || !description) return res.status(400).json({ error: 'Subject and description required' });

    const adminClient = getAdminClient();
    const ticketNumber = `TKT${Date.now()}${Math.floor(Math.random() * 10000)}`;
    const { data, error } = await adminClient.from('support_tickets').insert({
      user_id: userId,
      ticket_number: ticketNumber,
      subject,
      description,
      priority: priority || 'medium',
      status: 'open'
    }).select().single();

    if (error) throw error;
    return res.json(data);
  } catch (error: unknown) {
    return res.status(500).json({ error: 'An internal error occurred' });
  }
}
