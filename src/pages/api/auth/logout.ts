import type { APIRoute } from "astro";
import { createServerSupabaseClient } from "@/lib/supabase";
// import { createCookieAdapter } from "@/lib/cookies"; // Removed this problematic import
import { logger } from "@/lib/logger";

export const POST: APIRoute = async ({ cookies: astroCookies, request, redirect }) => {
  try {
    // const cookieAdapter = createCookieAdapter(astroCookies); // Removed usage of adapter
    const supabase = createServerSupabaseClient({
      cookies: astroCookies, // Pass astroCookies directly
      headers: request.headers,
    });

    // Sign out using Supabase client
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Error during logout:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    // Clear all Supabase-related cookies
    const sessionCookieNames = ["sb-access-token", "sb-refresh-token"];
    sessionCookieNames.forEach((name) => {
      astroCookies.delete(name, {
        path: "/",
      });
    });

    logger.info("User logged out successfully");
    return redirect("/auth/login");
  } catch (error) {
    logger.error("Unexpected error during logout:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
