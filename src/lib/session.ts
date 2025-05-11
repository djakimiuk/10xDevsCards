import { createServerSupabaseClient, getUser } from "./supabase";
import type { Session } from "@supabase/supabase-js";
import type { CookieOptions } from "@supabase/ssr";

/**
 * Get the current user's session from a request
 */
export async function getSessionFromRequest(request: Request): Promise<Session | null> {
  const cookieHeader = request.headers.get("cookie");
  const cookies = new Map<string, string>();

  if (cookieHeader) {
    cookieHeader.split("; ").forEach((cookie) => {
      const [name, value] = cookie.split("=");
      if (name && value) {
        cookies.set(name, value);
      }
    });
  }

  const cookieAdapter = {
    get: (name: string) => cookies.get(name) || null,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    set: (name: string, value: string, options: CookieOptions) => {
      // Not needed for getting session
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    delete: (name: string, options?: CookieOptions) => {
      // Not needed for getting session
    },
  };

  const supabase = createServerSupabaseClient({ cookies: cookieAdapter });
  const { user } = await getUser(supabase);

  if (!user) return null;

  return {
    access_token: cookies.get("sb-access-token") || "",
    refresh_token: cookies.get("sb-refresh-token") || "",
    user,
  } as Session;
}
