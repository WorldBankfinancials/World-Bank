import { config } from './config';
import { CompleteSupabaseStorage } from './supabase-storage-complete';
import type { IStorage } from './storage';

// SUPABASE ONLY - No fallbacks, no Replit Postgres
export function createStorage(): IStorage {
  if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('❌ CRITICAL: Supabase credentials required! Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  }
  
  console.log('🔧 Storage Factory: Creating CompleteSupabaseStorage instance...');
  console.log('📍 Supabase URL:', process.env.VITE_SUPABASE_URL);
  
  const instance = new CompleteSupabaseStorage();
  
  console.log('✅ Storage Factory: CompleteSupabaseStorage instance created successfully');
  return instance;
}

// Export singleton storage instance
console.log('🚀 Initializing storage factory...');
export const storage = createStorage();
console.log('✅ Storage factory initialized - ready for database operations');