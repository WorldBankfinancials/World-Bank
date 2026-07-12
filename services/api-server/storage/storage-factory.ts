import { config } from '../config';
import { SupabasePublicStorage } from './supabase-public-storage';
import type { IStorage } from './storage';

// SUPABASE REST API MODE: HTTP-based, works in Replit's restricted network
export function createStorage(): IStorage {
  // Use Supabase REST API which works in Replit (HTTP-based, not direct Postgres)
  const instance = new SupabasePublicStorage();
  return instance;
}

// Export singleton storage instance
export const storage = createStorage();
