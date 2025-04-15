import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import type { Database } from "../db/database.types";

export const createSupabaseServerInstance = ({ cookies, headers }: { cookies: AstroCookies; headers: Headers }) => {
  const cookieOptions: CookieOptions = {
    path: "/",
    secure: true,
    httpOnly: true,
    sameSite: "lax",
  };

  return createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookies: {
      get(key) {
        return cookies.get(key)?.value;
      },
      set(key, value, options) {
        cookies.set(key, value, { ...cookieOptions, ...options });
      },
      remove(key, options) {
        cookies.delete(key, { ...cookieOptions, ...options });
      },
    },
  });
};
