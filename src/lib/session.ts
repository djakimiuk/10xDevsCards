import type { Session } from "@supabase/supabase-js";
import { createSupabaseServerInstance } from "./supabase.server";
import type { CookieOptions } from "@supabase/ssr";

function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts[0]?.trim();
    if (name) {
      cookies[name] = parts[1]?.trim() || "";
    }
  });

  return cookies;
}

/**
 * Pobiera sesję użytkownika z żądania
 * @param request - obiekt żądania
 * @returns Promise<Session | null> - sesja użytkownika lub null
 */
export async function getSession(request: Request): Promise<Session | null> {
  try {
    const cookieHeader = request.headers.get("cookie");
    const cookies = parseCookies(cookieHeader);

    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies: {
        get: (name: string) => cookies[name] || null,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        set: (name: string, value: string, options: CookieOptions) => {
          // W kontekście getSession nie potrzebujemy ustawiać cookies
          return;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        delete: (name: string, options?: CookieOptions) => {
          // W kontekście getSession nie potrzebujemy usuwać cookies
          return;
        },
      },
    });

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error("Error getting session:", error);
      return null;
    }

    return session;
  } catch (error) {
    console.error("Unexpected error getting session:", error);
    return null;
  }
}
