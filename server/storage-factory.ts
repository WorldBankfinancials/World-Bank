/**
 * server/storage-factory.ts
 * Creates and exports the single IStorage singleton.
 * Exclusively uses SupabasePublicStorage (Supabase REST, works in all environments).
 */
import { SupabasePublicStorage } from './supabase-public-storage';
import type { IStorage } from './storage';

let _instance: IStorage | null = null;

export function createStorage(): IStorage {
  if (!_instance) {
    _instance = new SupabasePublicStorage();
  }
  return _instance;
}

export const storage: IStorage = createStorage();
