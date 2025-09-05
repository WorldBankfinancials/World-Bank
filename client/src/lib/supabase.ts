// client/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// ✅ Environment variables only
// Add these in your `.env` file (and in Vercel → Project Settings → Environment Variables)
// VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Missing Supabase credentials. Check your .env file.");
}

console.log("🔧 Supabase Configuration Loaded");
console.log("📍 URL:", supabaseUrl);
console.log("🔑 Key Prefix:", supabaseAnonKey.substring(0, 10) + "...");

// ✅ Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: "pkce",
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
});

// ✅ Authentication event logging
supabase.auth.onAuthStateChange((event, session) => {
  console.log("Supabase Auth Event:", event, session?.user?.email);

  if (event === "SIGNED_IN" && session) {
    console.log("✅ Signed in:", session.user.email);
  }

  if (event === "SIGNED_OUT") {
    console.log("✅ Signed out");
  }
});

// ✅ Connection tester
const testConnection = async () => {
  try {
    console.log("🔍 Testing Supabase connection...");
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    console.log("✅ Supabase connected.");
    if (data?.session?.user?.email) {
      console.log("👤 Active session:", data.session.user.email);
    }
  } catch (error) {
    console.error("❌ Supabase connection failed:", error);
  }
};

testConnection();
