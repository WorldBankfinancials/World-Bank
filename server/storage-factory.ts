import { config } from './config';
import { MemStorage } from './storage';
import { PostgresStorage } from './postgres-storage';
import { SupabasePublicStorage } from './supabase-public-storage';
import type { IStorage } from './storage';

export function createStorage(): IStorage {
  const dataSource = config.getDataSource();
  console.log(`\n🏦 World Bank Storage Configuration:`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`💾 Data Source: ${dataSource}`);
  console.log(`🔐 Auth Source: ${config.getAuthSource()}`);
  console.log('');

  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_URL) {
    console.log('Using Supabase public schema with realtime synchronization');
    return new SupabasePublicStorage();
  }

  if (process.env.DATABASE_URL) {
    console.log('Using PostgreSQL database storage');
    return new PostgresStorage();
  }

  return new MemStorage();
}

export const storage = createStorage();
