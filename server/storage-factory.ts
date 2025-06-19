import { config } from './config';
import { MemStorage } from './storage';
import { SupabaseStorage } from './supabase-storage';
import type { IStorage } from './storage';

// Environment-based storage factory
export function createStorage(): IStorage {
  const dataSource = config.getDataSource();
  
  console.log(`\n🏦 World Bank Storage Configuration:`);
  console.log(`📊 Environment: ${config.NODE_ENV}`);
  console.log(`💾 Data Source: ${dataSource}`);
  console.log(`🔐 Auth Source: ${config.getAuthSource()}`);
  console.log('');
  
  switch (dataSource) {
    case 'supabase':
      console.log('Using Supabase storage for production');
      return new SupabaseStorage();
    case 'memory':
    default:
      console.log('Using in-memory storage for development');
      return new MemStorage();
  }
}

// Export singleton storage instance
export const storage = createStorage();