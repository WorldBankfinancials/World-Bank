import { config } from './config';
import { MemStorage } from './storage';
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
  
  // ✅ Fix: check for Supabase credentials
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    console.log('✅ Using Supabase public schema with realtime synchronization');
    return new SupabasePublicStorage();
  }
  
  // ✅ PostgreSQL
  if (process.env.DATABASE_URL) {
    console.log('✅ Using PostgreSQL database storage');
    return new PostgresStorage();
  }
  
  // ✅ Memory (development fallback)
  console.log('⚠️ Using in-memory storage (development mode)');
  return new MemStorage();
}

// Export singleton storage instance
export const storage = createStorage();
