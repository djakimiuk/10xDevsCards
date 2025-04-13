import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

export const DEFAULT_USER_ID = "853c601f-8e79-45c0-9db6-0e4b6c1db6c3";
