import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../lib/supabase.server";
import { getSession } from "../lib/session";

// Ścieżki publiczne, dostępne bez logowania
const PUBLIC_PATHS = ["/auth/login", "/auth/register", "/auth/forgot-password"];

export const onRequest = defineMiddleware(async (context, next) => {
  const { cookies, request, redirect, url, locals } = context;

  // Inicjalizacja klienta Supabase dla SSR
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  // Zapisanie instancji supabase w locals dla późniejszego użycia
  locals.supabase = supabase;

  // Pobranie i weryfikacja użytkownika
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Jeśli użytkownik jest zalogowany i zweryfikowany
  if (user && !error) {
    // Zapisanie danych użytkownika w locals
    locals.user = {
      id: user.id,
      email: user.email || "",
    };

    // Jeśli próbuje dostać się do strony logowania, przekieruj do /generate
    if (PUBLIC_PATHS.includes(url.pathname)) {
      return redirect("/generate");
    }
  }
  // Jeśli użytkownik nie jest zalogowany lub wystąpił błąd weryfikacji
  else {
    // Jeśli próbuje dostać się do chronionej strony, przekieruj do logowania
    if (!PUBLIC_PATHS.includes(url.pathname)) {
      const session = await getSession(context.request);
      if (!session) {
        return redirect("/auth/login");
      }
      return redirect("/auth/login");
    }
  }

  // Kontynuuj przetwarzanie żądania
  return next();
});
