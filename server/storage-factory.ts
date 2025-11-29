import { config } from './config';
import { CompleteSupabaseStorage } from './supabase-storage-complete';
import type { IStorage } from './storage';

// SUPABASE ONLY - No fallbacks, no Replit Postgres
export function createStorage(): IStorage {
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('❌ CRITICAL: Supabase credentials required! Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  
  return new CompleteSupabaseStorage();
}

// Export singleton storage instance
export const storage = createStorage();