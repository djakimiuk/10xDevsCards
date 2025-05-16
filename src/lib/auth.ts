import { createBrowserClient } from "@supabase/ssr";
import { logger } from "@/lib/logger";
import type { Database } from "@/db/database.types";
import { AuthError } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

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
  "Logout failed": "Wystąpił błąd podczas wylogowywania",
  "Missing Supabase configuration": "Brak konfiguracji Supabase",
  default: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później",
};

/**
 * Helper function to create a Supabase client with environment variables
 */
const createSupabaseClient = () => {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  logger.debug("Creating Supabase client with config:", {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
  });

  if (!supabaseUrl || !supabaseAnonKey) {
    logger.error("Missing Supabase configuration", {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
    });
    throw new Error("Missing Supabase configuration");
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

/**
 * Helper function to handle auth errors consistently
 */
export const handleAuthError = (error: unknown): never => {
  logger.debug("handleAuthError received error:", {
    errorType: error?.constructor?.name,
    errorInstance: error instanceof Error,
    errorMessage: error instanceof Error ? error.message : String(error),
    isAuthError: error instanceof AuthError,
    stackTrace: error instanceof Error ? error.stack : undefined,
    hasMapping: error instanceof Error && error.message in friendlyAuthErrors,
  });

  if (error instanceof AuthError) {
    const message = error.message;
    logger.debug("Handling AuthError", {
      message,
      mappedMessage: friendlyAuthErrors[message],
      hasMapping: message in friendlyAuthErrors,
    });
    throw new Error(friendlyAuthErrors[message] || friendlyAuthErrors.default);
  } else if (error instanceof Error) {
    const message = error.message;
    logger.debug("Handling standard Error", {
      message,
      mappedMessage: friendlyAuthErrors[message],
      hasMapping: message in friendlyAuthErrors,
      willUseDefault: !friendlyAuthErrors[message],
    });
    throw new Error(friendlyAuthErrors[message] || friendlyAuthErrors.default);
  } else {
    logger.debug("Handling unknown error type");
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
export const logoutUser = async (): Promise<void> => {
  logger.debug("Starting logout process");

  try {
    const supabase = createSupabaseClient();
    logger.debug("Supabase client created");

    const { error } = await supabase.auth.signOut();
    logger.debug("Logout attempt completed", {
      hasError: !!error,
      errorType: error?.constructor?.name,
      errorMessage: error?.message,
      isAuthError: error instanceof AuthError,
      errorDetails: error,
    });

    if (error) {
      logger.debug("Handling signOut error", {
        originalError: error,
        originalErrorType: error.constructor.name,
        originalMessage: error.message,
        isAuthError: error instanceof AuthError,
      });

      // Jeśli to nie jest AuthError, tworzymy nowy AuthError
      if (!(error instanceof AuthError)) {
        const authError = new AuthError("Logout failed");
        logger.debug("Created new AuthError", {
          newError: authError,
          newErrorType: authError.constructor.name,
          newErrorMessage: authError.message,
        });
        handleAuthError(authError);
      }

      handleAuthError(error);
    }

    logger.debug("Logout successful, redirecting to login page");
    window.location.href = "/auth/login";
  } catch (error) {
    logger.debug("Caught error in logoutUser catch block", {
      errorType: error?.constructor?.name,
      errorMessage: error instanceof Error ? error.message : String(error),
      isAuthError: error instanceof AuthError,
      error,
    });

    // Jeśli to nie jest AuthError, tworzymy nowy AuthError
    if (!(error instanceof AuthError)) {
      const authError = new AuthError("Logout failed");
      logger.debug("Created new AuthError in catch block", {
        newError: authError,
        newErrorType: authError.constructor.name,
        newErrorMessage: authError.message,
      });
      handleAuthError(authError);
    }

    handleAuthError(error);
  }
};

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

/**
 * Pobiera aktualnie zalogowanego użytkownika
 * @param supabase - klient Supabase
 * @returns Promise<User | null>
 */
export async function getUser(supabase: SupabaseClient<Database>) {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      logger.debug("Error getting user:", { error });
      return null;
    }

    return user;
  } catch (error) {
    logger.debug("Unexpected error getting user:", { error });
    return null;
  }
}
