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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.error("Login failed", { error: error.message });
      throw error;
    }

    logger.info("User logged in successfully", { email });

    // Przekierowanie do /generate po udanym logowaniu
    window.location.href = "/generate";
  } catch (error) {
    logger.error("Unexpected error during login", { error });
    throw error;
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
    });

    if (error) {
      logger.error("Registration failed", { error: error.message });
      throw error;
    }

    logger.info("User registered successfully", { email });

    // Wyloguj użytkownika, jeśli został automatycznie zalogowany
    await supabase.auth.signOut();

    // Przekierowanie do strony logowania z parametrem success
    window.location.href = "/auth/login?registration=success";
  } catch (error) {
    logger.error("Unexpected error during registration", { error });
    throw error;
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
      throw error;
    }

    logger.info("User logged out successfully");

    // Przekierowanie do strony logowania po wylogowaniu
    window.location.href = "/auth/login";
  } catch (error) {
    logger.error("Unexpected error during logout", { error });
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      logger.error("Password reset error:", error);
      throw new Error(friendlyAuthErrors[error.message] || friendlyAuthErrors.default);
    }

    logger.info("Password reset link sent to email", { email });
  } catch (error) {
    logger.error("Caught error during password reset:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(friendlyAuthErrors.default);
  }
};

export const resetPassword = async (password: string, confirmPassword: string) => {
  try {
    if (password !== confirmPassword) {
      throw new Error("Hasła nie są identyczne");
    }

    if (password.length < 6) {
      throw new Error("Hasło musi mieć co najmniej 6 znaków");
    }

    // Sprawdzamy sesję
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw new Error(friendlyAuthErrors[sessionError.message] || friendlyAuthErrors.default);
    }

    if (!session) {
      throw new Error("Brak aktywnej sesji. Spróbuj ponownie zresetować hasło.");
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      throw new Error(friendlyAuthErrors[error.message] || friendlyAuthErrors.default);
    }

    // Po pomyślnym resecie hasła, przekieruj na stronę logowania
    window.location.href = "/auth/login?reset=success";
  } catch (error) {
    console.error("Złapany błąd:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(friendlyAuthErrors.default);
  }
};

// Replace console.log with proper error handling or logging service
export async function handleAuthError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}
