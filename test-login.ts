import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.VITE_SUPABASE_ANON_KEY || ""
);

async function test() {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "vaa33053@gmail.com",
      password: "Test123456"
    });
    
    if (error) {
      console.log("❌ Login error:", error.message);
    } else {
      console.log("✅ LOGIN SUCCESS!");
      console.log("User ID:", data.user.id);
      console.log("Email:", data.user.email);
    }
  } catch (e) {
    console.log("Error:", (e as any).message);
  }
}

test();
