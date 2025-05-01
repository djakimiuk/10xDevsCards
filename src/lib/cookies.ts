import type { AstroCookies } from "astro";
import type { CookieOptions } from "@supabase/ssr";

/**
 * Adapter dla AstroCookies do formatu wymaganego przez Supabase SSR
 * @param astroCookies - obiekt cookies z Astro
 */
export function createCookieAdapter(astroCookies: AstroCookies) {
  return {
    get: (name: string) => astroCookies.get(name)?.value ?? null,
    set: (name: string, value: string, options: CookieOptions) => {
      astroCookies.set(name, value, {
        ...options,
        path: "/",
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
      });
    },
    delete: (name: string, options?: CookieOptions) => {
      astroCookies.delete(name, {
        ...options,
        path: "/",
      });
    },
  };
}
