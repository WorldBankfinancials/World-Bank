/**
 * SUPABASE LIVE CHAT IMPLEMENTATION
 */

import { Request, Response } from 'express';
import { getAdminClient } from './supabase-public-storage';
import { AuthenticatedRequest } from './auth-middleware';
import { cryptoRandomInt } from './crypto-utils';
import { validateRequest, supportTicketSchema } from './validation-schemas';

export async function getChatHistory(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    return res.json(data || []);
  } catch (error: unknown) {
    console.error('[live-chat] getChatHistory error:', error instanceof Error ? error.message : 'unknown');
    return res.status(500).json({ error: 'An internal error occurred' });
  }
}

export async function getActiveSessions(req: AuthenticatedRequest, res: Response) {
  try {
    if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    const adminClient = getAdminClient();
    const { data, error } = await adminClient
      .from('messages')
      .select('sender_id, sender_role, message, created_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return res.json(data || []);
  } catch (error: unknown) {
    console.error('[live-chat] getActiveSessions error:', error instanceof Error ? error.message : 'unknown');
    return res.status(500).json({ error: 'An internal error occurred' });
  }
}

export async function createTicketFromChat(req: AuthenticatedRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const validation = validateRequest(supportTicketSchema, req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Validation failed', details: validation.errors });
    }

    const { subject, description, priority } = validation.data;
    const adminClient = getAdminClient();
    const ticketNumber = `TKT${Date.now()}${cryptoRandomInt(0, 99999)}`;
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
    console.error('[live-chat] createTicketFromChat error:', error instanceof Error ? error.message : 'unknown');
    return res.status(500).json({ error: 'An internal error occurred' });
  }
}
