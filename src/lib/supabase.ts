import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "../db/database.types";
import type { AstroCookies } from "astro";
import { logger } from "./logger";

export const cookieOptions: CookieOptions = {
  path: "/",
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 7 days
};

// Browser client singleton
let browserClient: SupabaseClient<Database> | undefined;

// Create browser client
export function createBrowserSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY);
  }
  return browserClient;
}

// Create server client
export function createServerSupabaseClient({ cookies }: { cookies: AstroCookies }) {
  return createServerClient(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookies.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        cookies.delete(name, options);
      },
    },
  });
}

// Helper to get user data
export async function getUser(supabase: SupabaseClient<Database>): Promise<{ user: User | null; error: Error | null }> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error: error as Error | null };
  } catch (error) {
    logger.error("Error getting user:", error);
    return { user: null, error: error as Error };
  }
}

const getSupabaseEnvVars = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return { url, anonKey };
};

export const createClient = (cookieStore: {
  get: (name: string) => { value: string } | undefined;
  set: (name: string, value: string, options: CookieOptions) => void;
  remove: (name: string, options: CookieOptions) => void;
  getAll: () => { name: string; value: string }[];
  setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => void;
}) => {
  const { url, anonKey } = getSupabaseEnvVars();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set(name, value, options);
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.remove(name, options);
      },
    },
  });
};
