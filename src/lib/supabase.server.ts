import { createClient } from "@supabase/supabase-js";

export function createSupabaseServerInstance() {
  return createClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      flowType: "pkce",
      detectSessionInUrl: false,
      persistSession: true,
    },
  });
}
