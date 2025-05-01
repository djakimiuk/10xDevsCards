import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "../db/database.types";

export function createSupabaseServerInstance({
  cookies,
  headers,
}: {
  cookies: {
    get: (name: string) => string | null | undefined;
    set: (name: string, value: string, options: CookieOptions) => void;
    delete: (name: string, options?: CookieOptions) => void;
  };
  headers?: Headers;
}) {
  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (name: string) => cookies.get(name),
      set: (name: string, value: string, options: CookieOptions) => {
        cookies.set(name, value, {
          ...options,
          path: "/",
          httpOnly: true,
          secure: import.meta.env.PROD,
          sameSite: "lax",
        });
      },
      remove: (name: string, options: CookieOptions) => {
        cookies.delete(name, {
          ...options,
          path: "/",
        });
      },
    },
    headers,
  });
}
