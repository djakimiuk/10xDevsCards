import { supabase } from "./supabase.client";
import { logger } from "./logger";

// Temporary placeholder functions for auth operations
// These will be replaced with actual implementations later

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
  default: "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później",
};

/**
 * Logowanie użytkownika
 * @param email - adres email użytkownika
 * @param password - hasło użytkownika
 * @returns Promise<void>
 * @throws Error z przyjaznym komunikatem błędu
 */
export const loginUser = async (email: string, password: string): Promise<void> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error("Login failed", { error: error.message });
      throw new Error(error.message);
    }

    if (!data.session) {
      logger.error("No session after login");
      throw new Error("Nie udało się utworzyć sesji");
    }

    logger.info("User logged in successfully", { email });

    // Bezpośrednie przekierowanie do /generate po udanym logowaniu
    window.location.href = "/generate";
  } catch (error) {
    logger.error("Unexpected error during login", { error });
    if (error instanceof Error) {
      throw new Error(friendlyAuthErrors[error.message] || friendlyAuthErrors.default);
    }
    throw new Error(friendlyAuthErrors.default);
  }
};

/**
 * Rejestracja nowego użytkownika
 * @param email - adres email użytkownika
 * @param password - hasło użytkownika
 * @returns Promise<void>
 * @throws Error z przyjaznym komunikatem błędu
 */
export const registerUser = async (email: string, password: string): Promise<void> => {
  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      logger.error("Registration failed", { error: error.message });
      throw new Error(error.message);
    }

    logger.info("User registered successfully", { email });

    // Wyloguj użytkownika, jeśli został automatycznie zalogowany
    await supabase.auth.signOut();

    // Przekierowanie do strony logowania z parametrem success
    window.location.href = "/auth/login?registration=success";
  } catch (error) {
    logger.error("Unexpected error during registration", { error });
    if (error instanceof Error) {
      throw new Error(friendlyAuthErrors[error.message] || friendlyAuthErrors.default);
    }
    throw new Error(friendlyAuthErrors.default);
  }
};

/**
 * Wylogowanie użytkownika
 * @returns Promise<void>
 * @throws Error z przyjaznym komunikatem błędu
 */
export const logoutUser = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error("Logout failed", { error: error.message });
      throw new Error(error.message);
    }

    logger.info("User logged out successfully");

    // Odśwież stronę zamiast przekierowania, aby middleware mógł przetworzyć wylogowanie
    window.location.reload();
  } catch (error) {
    logger.error("Unexpected error during logout", { error });
    if (error instanceof Error) {
      throw new Error(friendlyAuthErrors[error.message] || friendlyAuthErrors.default);
    }
    throw new Error(friendlyAuthErrors.default);
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      logger.error("Password reset error:", error);
      throw new Error(error.message);
    }

    logger.info("Password reset link sent to email", { email });
  } catch (error) {
    logger.error("Caught error during password reset:", error);
    if (error instanceof Error) {
      throw new Error(friendlyAuthErrors[error.message] || friendlyAuthErrors.default);
    }
    throw new Error(friendlyAuthErrors.default);
  }
};

export const resetPassword = async (password: string, confirmPassword: string) => {
  try {
    // Validate password match
    if (password !== confirmPassword) {
      logger.error("Password mismatch during reset");
      throw new Error("Hasła nie są identyczne");
    }

    // Validate password length
    if (password.length < 6) {
      logger.error("Password too short during reset");
      throw new Error("Hasło musi mieć co najmniej 6 znaków");
    }

    // Sprawdzamy sesję
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      logger.error("Session error during password reset:", sessionError);
      throw new Error(sessionError.message);
    }

    if (!session) {
      logger.error("No active session during password reset");
      throw new Error("Brak aktywnej sesji. Spróbuj ponownie zresetować hasło.");
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      logger.error("Error updating password:", error);
      throw new Error(error.message);
    }

    logger.info("Password reset successful");
    // Po pomyślnym resecie hasła, przekieruj na stronę logowania
    window.location.href = "/auth/login?reset=success";
  } catch (error) {
    logger.error("Caught error during password reset:", error);
    if (error instanceof Error) {
      // For validation errors, throw them directly
      if (
        error.message === "Hasła nie są identyczne" ||
        error.message === "Hasło musi mieć co najmniej 6 znaków" ||
        error.message === "Brak aktywnej sesji. Spróbuj ponownie zresetować hasło."
      ) {
        throw error;
      }
      // For other errors, use the mapping
      throw new Error(friendlyAuthErrors[error.message] || friendlyAuthErrors.default);
    }
    throw new Error(friendlyAuthErrors.default);
  }
};

// Replace console.log with proper error handling or logging service
export async function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    return friendlyAuthErrors[error.message] || friendlyAuthErrors.default;
  }
  return friendlyAuthErrors.default;
}
