import type { APIRoute } from "astro";
import { createServerSupabaseClient } from "@/lib/supabase";
import { logger } from "@/lib/logger";

export const prerender = false;

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  try {
    const supabase = createServerSupabaseClient({ cookies });

    const code = url.searchParams.get("code");
    const next = url.searchParams.get("next") ?? "/generate";

    if (!code) {
      logger.error("No code provided in callback");
      return redirect("/auth/login");
    }

    logger.debug("Processing auth callback", { code, next });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      logger.error("Error exchanging code for session:", error);
      return redirect("/auth/login");
    }

    logger.info("Successfully exchanged code for session");
    return redirect(next);
  } catch (error) {
    logger.error("Unexpected error in auth callback:", error);
    return redirect("/auth/login");
  }
};
