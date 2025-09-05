// client/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env / Vercel env."
  );
}

console.log("🔧 Supabase Configuration Loaded");
console.log("📍 URL:", supabaseUrl);
console.log("🔑 Key Prefix:", supabaseAnonKey.substring(0, 10) + "...");

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

supabase.auth.onAuthStateChange((event, session) => {
  console.log("Supabase Auth Event:", event, session?.user?.email ?? null);
});

const testConnection = async () => {
  try {
    const { data } = await supabase.auth.getSession();
    console.log("✅ Supabase connection OK. Active session:", data?.session?.user?.email ?? "none");
    return true;
  } catch (e) {
    console.error("❌ Supabase testConnection failed", e);
    return false;
  }
};
testConnection();
