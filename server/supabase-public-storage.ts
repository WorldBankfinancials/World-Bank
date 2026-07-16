import { createClient } from '@supabase/supabase-js';
import { log } from './vite';

// Use service role key for server-side operations (bypasses RLS)
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Public client (anon key) - respects RLS
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// Admin client (service role key) - bypasses RLS - cached singleton
let _adminClient: ReturnType<typeof createClient> | null = null;

export function getAdminClient() {
  if (!_adminClient) {
    _adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
  return _adminClient;
}

// Storage helpers
export async function uploadFile(bucket: string, path: string, file: Buffer, contentType: string) {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient.storage.from(bucket).upload(path, file, {
    contentType,
    upsert: true
  });
  if (error) throw error;
  return data;
}

export async function getFileUrl(bucket: string, path: string) {
  const adminClient = getAdminClient();
  const { data } = adminClient.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteFile(bucket: string, path: string) {
  const adminClient = getAdminClient();
  const { error } = await adminClient.storage.from(bucket).remove([path]);
  if (error) throw error;
}

export async function listFiles(bucket: string, prefix?: string) {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient.storage.from(bucket).list(prefix || '');
  if (error) throw error;
  return data;
}

// Database helpers
export async function insertRecord(table: string, record: Record<string, unknown>) {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient.from(table).insert(record).select().single();
  if (error) throw error;
  return data;
}

export async function updateRecord(table: string, id: string | number, updates: Record<string, unknown>) {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient.from(table).update(updates).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteRecord(table: string, id: string | number) {
  const adminClient = getAdminClient();
  const { error } = await adminClient.from(table).delete().eq('id', id);
  if (error) throw error;
}

export async function getRecord(table: string, id: string | number) {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient.from(table).select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

export async function listRecords(table: string, filters?: Record<string, unknown>) {
  const adminClient = getAdminClient();
  let query = adminClient.from(table).select('*');
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value);
    }
  }
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

// Auth helpers
export async function getUserById(userId: string) {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient.auth.admin.getUserById(userId);
  if (error) throw error;
  return data;
}

export async function listAuthUsers() {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient.auth.admin.listUsers();
  if (error) throw error;
  return data;
}

export async function deleteAuthUser(userId: string) {
  const adminClient = getAdminClient();
  const { error } = await adminClient.auth.admin.deleteUser(userId);
  if (error) throw error;
}

// Realtime subscription helper
export function subscribeToTable(table: string, callback: (payload: unknown) => void) {
  return supabase.channel(`realtime:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
    .subscribe();
}
