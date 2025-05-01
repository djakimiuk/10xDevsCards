import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

declare global {
  namespace App {
    interface Locals {
      // Używamy ogólnego typu, żeby uniknąć problemów niezgodności
      supabase: SupabaseClient<Database>;
      user?: {
        id: string;
        email: string;
      };
    }
  }
}
