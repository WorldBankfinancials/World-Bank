import { config } from './config';
import { PostgresStorage } from './postgres-storage';
import { SupabasePublicStorage } from './supabase-public-storage';
import { CompleteSupabaseStorage } from './supabase-storage-complete';
import type { IStorage } from './storage';

// Environment-based storage factory
// PRIORITY: Supabase HTTP client (works from Replit) > Direct Postgres (fails from Replit due to DNS blocking)
export function createStorage(): IStorage {
  const dataSource = config.getDataSource();
  
  console.log(`\n🏦 World Bank Storage Configuration:`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`💾 Data Source: ${dataSource}`);
  console.log(`🔐 Auth Source: ${config.getAuthSource()}`);
  console.log('');
  
  // PRIMARY: Use Supabase HTTP client (works from Replit, direct postgres fails with DNS blocking)
  if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('✅ Using Supabase HTTP client (works from Replit)');
    return new CompleteSupabaseStorage();
  }
  
  // FALLBACK: Direct PostgreSQL (only if Supabase not available)
  if (process.env.DATABASE_URL) {
    console.log('⚠️  Using PostgreSQL direct connection (may fail from Replit)');
    return new PostgresStorage();
  }
  
  // FALLBACK: Supabase public schema
  if (process.env.SUPABASE_DATABASE_URL) {
    console.log('⚠️  Using Supabase public schema as fallback');
    return new SupabasePublicStorage();
  }
  
  // PRODUCTION-READY: No fallback to mock data - database required
  throw new Error('❌ CRITICAL: No database configured! Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Export singleton storage instance
export const storage = createStorage();