import { config } from './config';
import { HybridPostgresStorage } from './hybrid-postgres-storage';
import type { IStorage } from './storage';

// HYBRID MODE: Direct Postgres + Supabase Auth
export function createStorage(): IStorage {
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ CRITICAL: DATABASE_URL required for direct Postgres connection.');
  }
  
  console.log('🔧 Storage Factory: Creating HybridPostgresStorage (Direct Postgres) instance...');
  console.log('⚡ Using DIRECT Postgres connection - bypassing REST API for maximum speed');
  
  const instance = new HybridPostgresStorage();
  
  console.log('✅ Storage Factory: HybridPostgresStorage instance created successfully');
  return instance;
}

// Export singleton storage instance
console.log('🚀 Initializing storage factory with DIRECT POSTGRES...');
export const storage = createStorage();
console.log('✅ Storage factory initialized - DIRECT POSTGRES ready for operations');