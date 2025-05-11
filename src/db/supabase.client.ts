import { createBrowserClient, createServerClient, type CookieOptions } from "@supabase/ssr";
import type { Database } from "./database.types";

export const cookieOptions: CookieOptions = {
  path: "/",
  secure: import.meta.env.PROD,
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

function parseCookieHeader(cookieHeader: string | null): { name: string; value: string }[] {
  if (!cookieHeader) return [];
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

// Browser client for client-side components
export const createBrowserSupabaseClient = () => {
  if (typeof window === "undefined") return null;

  return createBrowserClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions,
    cookies: {
      getAll: () => {
        return document.cookie.split("; ").map((cookie) => {
          const [name, value] = cookie.split("=");
          return { name, value };
        });
      },
      setAll: (cookieList) => {
        cookieList.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; ${Object.entries({ ...cookieOptions, ...options })
            .map(([k, v]) => `${k}=${v}`)
            .join("; ")}`;
        });
      },
    },
  });
};

// Lazy initialize browser client
export const supabaseClient = typeof window !== "undefined" ? createBrowserSupabaseClient() : null;

// Server client for server-side components (Astro pages)
export const createServerSupabaseClient = ({
  cookies,
  headers,
}: {
  cookies: {
    get: (name: string) => string | null | undefined;
    set: (name: string, value: string, options: CookieOptions) => void;
    delete: (name: string, options?: CookieOptions) => void;
  };
  headers?: Headers;
}) => {
  return createServerClient<Database>(import.meta.env.PUBLIC_SUPABASE_URL, import.meta.env.PUBLIC_SUPABASE_ANON_KEY, {
    cookieOptions,
    cookies: {
      getAll: () => {
        if (headers) {
          const cookieHeader = headers.get("cookie");
          return parseCookieHeader(cookieHeader);
        }
        return [];
      },
      setAll: (cookieList) => {
        cookieList.forEach(({ name, value, options }) => {
          cookies.set(name, value, { ...cookieOptions, ...options });
        });
      },
    },
  });
};

export const DEFAULT_USER_ID = import.meta.env.PUBLIC_DEFAULT_USER_ID;
