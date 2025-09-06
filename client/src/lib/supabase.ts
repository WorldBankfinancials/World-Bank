// client/src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase credentials. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env"
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

supabase.auth.onAuthStateChange((event, session) => {
  // Helpful logs (no secrets)
  console.log("Supabase auth event:", event, session?.user?.email ?? null);
});
  if (event === "SIGNED_IN" && session) {
    console.log("✅ Signed in:", session.user.email);
  }

  if (event === "SIGNED_OUT") {
    console.log("✅ Signed out");
  }
});

