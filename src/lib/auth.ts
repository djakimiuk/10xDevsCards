import { createBrowserClient } from "@supabase/ssr";
import { logger } from "./logger";
import type { Database } from "@/db/database.types";
import { AuthError } from "@supabase/supabase-js";

// Mapowanie błędów Supabase na przyjazne komunikaty
const friendlyAuthErrors: Record<string, string> = {
  "Invalid login credentials": "Niepoprawny email lub hasło",
  "Email not confirmed": "Proszę potwierdzić adres email",
  "Too many requests": "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę",
  "Network error": "Problem z połączeniem. Sprawdź internet i spróbuj ponownie",
  "User already registered": "Użytkownik o tym adresie email już istnieje",
  "Hasła nie są identyczne": "Hasła nie są identyczne",
  "Hasło musi mieć co najmniej 6 znaków": "Hasło musi mieć co najmniej 6 znaków",
  "Brak aktywnej sesji": "Brak aktywnej sesji. Spróbuj ponownie zresetować hasło.",
  "Nie udało się utworzyć sesji": "Nie udało się utworzyć sesji",
  "Session fetch failed": "Brak aktywnej sesji",
  "Logout failed in Supabase": "Wystąpił błąd podczas wylogowywania",
  "Missing Supabase configuration": "Brak konfiguracji Supabase",
  default: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później",
};

/**
 * Helper function to create a Supabase client with environment variables
 */
const createSupabaseClient = () => {
  const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase configuration");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * Helper function to handle auth errors consistently
 */
export const handleAuthError = (error: unknown): never => {
  logger.error("Auth error occurred", { error });

  if (error instanceof AuthError) {
    const message = error.message;
    throw new Error(friendlyAuthErrors[message] || friendlyAuthErrors.default);
  } else if (error instanceof Error) {
    const message = error.message;
    throw new Error(friendlyAuthErrors[message] || friendlyAuthErrors.default);
  } else {
    throw new Error(friendlyAuthErrors.default);
  }
};

/**
 * Logowanie użytkownika
 * @param email - adres email użytkownika
 * @param password - hasło użytkownika
 * @returns Promise<void>
 * @throws Error z przyjaznym komunikatem błędu
 */
export async function loginUser(email: string, password: string): Promise<void> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    handleAuthError(error);
  }

  if (!data.session) {
    throw new Error("Nie udało się utworzyć sesji");
  }

  window.location.href = "/dashboard";
}

/**
 * Rejestracja nowego użytkownika
 * @param email - adres email użytkownika
 * @param password - hasło użytkownika
 * @returns Promise<void>
 * @throws Error z przyjaznym komunikatem błędu
 */
export async function registerUser(email: string, password: string): Promise<void> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    handleAuthError(error);
  }

  if (!data.user) {
    throw new Error("Nie udało się utworzyć konta");
  }

  window.location.href = "/auth/login";
}

/**
 * Wylogowanie użytkownika
 * @returns Promise<void>
 * @throws Error z przyjaznym komunikatem błędu
 */
export async function logoutUser(): Promise<void> {
  const supabase = createSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    handleAuthError(new Error("Logout failed in Supabase"));
  }

  logger.info("User logged out successfully");
  window.location.href = "/auth/login";
}

/**
 * Wysyłanie emaila resetującego hasło
 */
export async function sendPasswordResetEmail(email: string): Promise<void> {
  const supabase = createSupabaseClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });

  if (error) {
    handleAuthError(error);
  }
}

/**
 * Aktualizacja hasła użytkownika
 */
export async function updateUserPassword(newPassword: string, confirmPassword: string): Promise<void> {
  if (newPassword !== confirmPassword) {
    throw new Error("Hasła nie są identyczne");
  }

  if (newPassword.length < 6) {
    throw new Error("Hasło musi mieć co najmniej 6 znaków");
  }

  const supabase = createSupabaseClient();

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

  if (sessionError) {
    handleAuthError(new Error("Session fetch failed"));
  }

  if (!sessionData.session) {
    handleAuthError(new Error("Brak aktywnej sesji"));
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    handleAuthError(updateError);
  }

  window.location.href = "/dashboard";
}
