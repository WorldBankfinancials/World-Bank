import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "❌ Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file."
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
  console.log("Supabase Auth Event:", event, session?.user?.email);

  if (event === "SIGNED_IN" && session) {
    console.log("✅ User signed in:", session.user.email);
  }

  if (event === "SIGNED_OUT") {
    console.log("✅ User signed out");
  }
});

const testConnection = async () => {
  try {
    console.log("🔍 Testing Supabase connection...");
    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    console.log("✅ Supabase is connected.");
    if (data?.session?.user?.email) {
      console.log("👤 Active session:", data.session.user.email);
    } else {
      console.log("ℹ️ No active session found.");
    }
    return true;
  } catch (error) {
    console.error("❌ Supabase connection failed:", error);
    return false;
  }
};

testConnection();
