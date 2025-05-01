import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../lib/supabase.server";
import { createCookieAdapter } from "../lib/cookies";

// Ścieżki publiczne, dostępne bez logowania
const PUBLIC_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/callback",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies: astroCookies, request, redirect, url, locals } = context;

  // Użycie adaptera cookies
  const cookies = createCookieAdapter(astroCookies);

  // Inicjalizacja klienta Supabase dla SSR
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  // Zapisanie instancji supabase w locals dla późniejszego użycia
  locals.supabase = supabase;

  try {
    // Pobranie sesji
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("Session error:", sessionError);
      // Wyczyść ciasteczka sesji w przypadku błędu
      const sessionCookies = ["sb-access-token", "sb-refresh-token"];
      sessionCookies.forEach((name) => {
        cookies.delete(name, { path: "/" });
      });

      if (!PUBLIC_PATHS.includes(url.pathname)) {
        return redirect("/auth/login");
      }
      return next();
    }

    // Jeśli użytkownik jest zalogowany i ma aktywną sesję
    if (session?.user) {
      // Zapisanie danych użytkownika w locals
      locals.user = {
        id: session.user.id,
        email: session.user.email || "",
      };

      // Jeśli próbuje dostać się do strony logowania, przekieruj do /generate
      if (PUBLIC_PATHS.includes(url.pathname)) {
        return redirect("/generate");
      }
    }
    // Jeśli użytkownik nie jest zalogowany
    else {
      // Jeśli próbuje dostać się do chronionej strony, przekieruj do logowania
      if (!PUBLIC_PATHS.includes(url.pathname)) {
        return redirect("/auth/login");
      }
    }

    // Kontynuuj przetwarzanie żądania
    return next();
  } catch (error) {
    console.error("Middleware error:", error);
    // W przypadku nieoczekiwanego błędu, przekieruj do logowania
    if (!PUBLIC_PATHS.includes(url.pathname)) {
      return redirect("/auth/login");
    }
    return next();
  }
});
