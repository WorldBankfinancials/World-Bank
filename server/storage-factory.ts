import { config } from './config';
import { PostgresStorage } from './postgres-storage';
import { SupabasePublicStorage } from './supabase-public-storage';
import { CompleteSupabaseStorage } from './supabase-storage-complete';
import type { IStorage } from './storage';

// Environment-based storage factory
// COMBINED STORAGE: Supabase Auth (login) + Supabase REST API (data) - works from Replit
export function createStorage(): IStorage {
  const dataSource = config.getDataSource();
  
  
  // PRIMARY: Use Supabase REST API (works from Replit, direct Postgres blocked by DNS)
  if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new CompleteSupabaseStorage();
  }
  
  // FALLBACK: Direct PostgreSQL (only if Supabase not available)
  if (process.env.DATABASE_URL) {
    return new PostgresStorage();
  }
  
  // FALLBACK: Supabase public schema
  if (process.env.SUPABASE_DATABASE_URL) {
    return new SupabasePublicStorage();
  }
  
  // PRODUCTION-READY: No fallback to mock data - database required
  throw new Error('❌ CRITICAL: No database configured! Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Export singleton storage instance
export const storage = createStorage();