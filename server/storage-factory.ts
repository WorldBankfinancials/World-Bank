/**
 * server/storage-factory.ts
 * Singleton IStorage instance backed by Supabase REST.
 */
import { SupabasePublicStorage } from './supabase-public-storage';
import type { IStorage } from './storage';

let _instance: IStorage | null = null;

export function createStorage(): IStorage {
  if (!_instance) _instance = new SupabasePublicStorage();
  return _instance;
}

export const storage: IStorage = createStorage();
