import { config } from './config';
import { PostgresStorage } from './postgres-storage';
import { SupabasePublicStorage } from './supabase-public-storage';
import { CompleteSupabaseStorage } from './supabase-storage-complete';
import type { IStorage } from './storage';

// Environment-based storage factory
// SINGLE SOURCE OF TRUTH: Postgres is primary, Supabase is optional secondary
export function createStorage(): IStorage {
  const dataSource = config.getDataSource();
  
  console.log(`\n🏦 World Bank Storage Configuration:`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`💾 Data Source: ${dataSource}`);
  console.log(`🔐 Auth Source: ${config.getAuthSource()}`);
  console.log('');
  
  // PRIMARY: Use PostgreSQL as the single source of truth when available
  if (process.env.DATABASE_URL) {
    console.log('✅ Using PostgreSQL as PRIMARY source of truth');
    console.log('📍 Supabase Auth (optional): available for sync if configured');
    return new PostgresStorage();
  }
  
  // FALLBACK: Supabase complete integration (if Postgres unavailable)
  if (process.env.VITE_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️  Using Supabase as fallback (Postgres not available)');
    return new CompleteSupabaseStorage();
  }
  
  // FALLBACK: Supabase public schema
  if (process.env.SUPABASE_DATABASE_URL) {
    console.log('⚠️  Using Supabase public schema as fallback');
    return new SupabasePublicStorage();
  }
  
  // PRODUCTION-READY: No fallback to mock data - database required
  throw new Error('❌ CRITICAL: No database configured! Set DATABASE_URL or SUPABASE_DATABASE_URL environment variable. Mock/in-memory storage has been removed for production readiness.');
}

// Export singleton storage instance
export const storage = createStorage();