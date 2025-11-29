import { config } from './config';
import { PostgresStorage } from './postgres-storage';
import { SupabasePublicStorage } from './supabase-public-storage';
import { CompleteSupabaseStorage } from './supabase-storage-complete';
import type { IStorage } from './storage';

// Environment-based storage factory
export function createStorage(): IStorage {
  const dataSource = config.getDataSource();
  
  // PRIMARY: Use direct PostgreSQL (Replit's database - RELIABLE)
  if (process.env.DATABASE_URL) {
    return new PostgresStorage();
  }
  
  // FALLBACK: Supabase REST API if Postgres not available
  if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new CompleteSupabaseStorage();
  }
  
  // FALLBACK: Supabase public schema
  if (process.env.SUPABASE_DATABASE_URL) {
    return new SupabasePublicStorage();
  }
  
  // PRODUCTION-READY: No fallback to mock data - database required
  throw new Error('❌ CRITICAL: No database configured! Set DATABASE_URL or SUPABASE credentials.');
}

// Export singleton storage instance
export const storage = createStorage();