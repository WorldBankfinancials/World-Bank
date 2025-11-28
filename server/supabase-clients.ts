import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

export const supabasePublic: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseAnonKey
);

export const supabaseService: SupabaseClient = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey
);