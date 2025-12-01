import { config } from './config';
import { UnifiedSyncStorage } from './unified-sync-storage';
import type { IStorage } from './storage';

// UNIFIED SYNC MODE: Postgres + Supabase + Memory Cache (TRIPLE-LAYER)
export function createStorage(): IStorage {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL required for Postgres connection');
  }
  
  const instance = new UnifiedSyncStorage();
  return instance;
}

// Export singleton storage instance
export const storage = createStorage();