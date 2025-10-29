import { config } from './config';
import { PostgresStorage } from './postgres-storage';
import { SupabasePublicStorage } from './supabase-public-storage';
import type { IStorage } from './storage';

// Environment-based storage factory
export function createStorage(): IStorage {
  const dataSource = config.getDataSource();
  
  console.log(`\n🏦 World Bank Storage Configuration:`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`💾 Data Source: ${dataSource}`);
  console.log(`🔐 Auth Source: ${config.getAuthSource()}`);
  console.log('');
  
  // Check if we have Supabase database URL to use Supabase public schema
  if (process.env.SUPABASE_DATABASE_URL) {
    console.log('Using Supabase public schema with realtime synchronization');
    return new SupabasePublicStorage();
  }
  
  // Use PostgreSQL database when available
  if (process.env.DATABASE_URL) {
    console.log('Using PostgreSQL database storage');
    return new PostgresStorage();
  }
  
  // PRODUCTION-READY: No fallback to mock data - database required
  throw new Error('❌ CRITICAL: No database configured! Set DATABASE_URL or SUPABASE_DATABASE_URL environment variable. Mock/in-memory storage has been removed for production readiness.');
}

// Export singleton storage instance
export const storage = createStorage();