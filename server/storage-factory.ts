import { config } from './config';
import { UnifiedSyncStorage } from './unified-sync-storage';
import type { IStorage } from './storage';

// UNIFIED SYNC MODE: Postgres + Supabase + Memory Cache (TRIPLE-LAYER)
export function createStorage(): IStorage {
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ CRITICAL: DATABASE_URL required for direct Postgres connection.');
  }
  
  console.log('🚀 Storage Factory: Creating UnifiedSyncStorage...');
  console.log('⚡ Layer 1: Supabase REST API (works from Replit)');
  console.log('⚡ Layer 2: Memory Cache (instant <0.1ms)');
  
  const instance = new UnifiedSyncStorage();
  
  console.log('✅ Storage Factory: UnifiedSyncStorage instance created successfully');
  return instance;
}

// Export singleton storage instance
console.log('🚀 Initializing unified sync storage factory...');
export const storage = createStorage();
console.log('✅ Storage factory initialized - Supabase REST API + Memory Cache ready');