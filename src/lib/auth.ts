import { supabase } from "./supabase.client";

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
    console.log("Próba logowania:", { email });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Błąd logowania:", error);
      // Mapowanie błędu na przyjazny komunikat
      const message = friendlyAuthErrors[error.message] || friendlyAuthErrors.default;
      throw new Error(message);
    }

    console.log("Logowanie udane:", data);

    // Przekierowanie do /generate po udanym logowaniu
    window.location.href = "/generate";
  } catch (error) {
    console.error("Złapany błąd:", error);
    if (error instanceof Error) {
      throw error;
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
    console.log("Próba rejestracji:", { email });

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error("Błąd rejestracji:", error);
      const message = friendlyAuthErrors[error.message] || friendlyAuthErrors.default;
      throw new Error(message);
    }

    console.log("Rejestracja udana:", data);

    // Wyloguj użytkownika, jeśli został automatycznie zalogowany
    await supabase.auth.signOut();

    // Przekierowanie do strony logowania z parametrem success
    window.location.href = "/auth/login?registration=success";
  } catch (error) {
    console.error("Złapany błąd:", error);
    if (error instanceof Error) {
      throw error;
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
      throw new Error("Wystąpił błąd podczas wylogowywania. Spróbuj ponownie.");
    }

    // Przekierowanie do strony logowania po wylogowaniu
    window.location.href = "/auth/login";
  } catch (error) {
    console.error("Błąd wylogowywania:", error);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      console.error("Błąd resetowania hasła:", error);
      throw new Error(friendlyAuthErrors[error.message] || friendlyAuthErrors.default);
    }

    console.log("Link do resetowania hasła wysłany na email");
  } catch (error) {
    console.error("Złapany błąd:", error);
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
