import { config } from './config';
import { MemStorage } from './storage';
import { PostgresStorage } from './postgres-storage';
import { SupabasePublicStorage } from './supabase-public-storage';
import type { IStorage } from './storage';

// Environment-based storage factory
export function createStorage(): IStorage {
  const dataSource = config.getDataSource();
  
  console.log(`\n🏦 Apex Banking Corporation Storage Configuration:`);
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
  
  switch (dataSource) {
    case 'memory':
    default:
      console.log('Using in-memory storage for development');
      return new MemStorage();
  }
}

// Export singleton storage instance
export const storage = createStorage();