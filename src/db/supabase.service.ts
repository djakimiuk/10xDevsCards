import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { logger } from "../lib/logger";

// Use the service role key which bypasses RLS
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// --- DODAJ LOGOWANIE TUTAJ ---
console.log("Cloudflare SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "SET" : "NOT SET or EMPTY");
if (supabaseServiceKey) {
  console.log("Cloudflare SUPABASE_SERVICE_ROLE_KEY length:", supabaseServiceKey.length);
  console.log("Cloudflare SUPABASE_SERVICE_ROLE_KEY first 5 chars:", supabaseServiceKey.substring(0, 5));
}
// --- KONIEC LOGOWANIA ---

if (!supabaseServiceKey) {
  logger.error("SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables");
}

// This client should only be used on the server side for operations
// that need to bypass Row Level Security (RLS) policies
export const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey || "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Export the default user ID for convenience
export const DEFAULT_USER_ID = import.meta.env.DEFAULT_USER_ID;
