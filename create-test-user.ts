import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: "vaa33053@gmail.com",
      password: "Test123456",
      email_confirm: true,
      user_metadata: {
        first_name: "Wei",
        last_name: "Liu",
      }
    });

    if (error) {
      console.log("Create user response:", error.message);
    } else {
      console.log("✅ Supabase Auth user created:", data.user.id);
    }
  } catch (e) {
    console.log("Error:", (e as any).message);
  }
}

main();
