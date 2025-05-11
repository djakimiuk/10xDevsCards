import type {} from "../.astro/types";
/// <reference types="astro/client" />
/// <reference types="astro/client-image" />

import type { SupabaseClient, User, Session } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

declare global {
  // Extend Astro namespace
  namespace Astro {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user: User | null;
      session: Session | null;
    }
  }

  // For Supabase
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user: SupabaseClient<Database>["auth"] | null;
      session: SupabaseClient<Database>["auth"] | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly SUPABASE_SERVICE_ROLE_KEY: string;
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_ANON_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly DEFAULT_USER_ID: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
