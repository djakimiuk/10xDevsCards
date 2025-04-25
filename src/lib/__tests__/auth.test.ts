import { describe, it, expect, vi, beforeEach } from "vitest";
import { loginUser, registerUser, sendPasswordResetEmail, resetPassword } from "../auth";
import { supabase } from "../supabase.client";
// Importujemy typy z Supabase do mockowania
import type { AuthTokenResponsePassword, AuthResponse, UserResponse } from "@supabase/supabase-js";

// Mockujemy moduł supabase, aby uniknąć rzeczywistych wywołań API
vi.mock("../supabase.client", () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      resetPasswordForEmail: vi.fn(),
      getSession: vi.fn(),
      updateUser: vi.fn(),
    },
  },
}));

// Mockujemy window.location.href
Object.defineProperty(window, "location", {
  value: {
    href: "",
    origin: "http://localhost:4321",
  },
  writable: true,
});

// Komentarz wyjaśniający użycie 'as any':
// W testach używamy 'as any' dla mocków Supabase, ponieważ dokładne odwzorowanie
// złożonych typów API byłoby zbyt skomplikowane i nie wniosłoby wartości do testów.
// W rzeczywistym kodzie używamy poprawnych typów, ale w testach upraszczamy struktury
// tak długo, jak zachowują one niezbędne pola używane przez testowane funkcje.

describe("Funkcje uwierzytelniania", () => {
  beforeEach(() => {
    // Resetujemy mocki przed każdym testem
    vi.resetAllMocks();
    window.location.href = "";
  });

  // TC-01: Poprawne logowanie (prawidłowe dane) → przekierowanie do `/generate`
  describe("loginUser", () => {
    it("TC-01: powinien zalogować użytkownika i przekierować do /generate przy poprawnych danych", async () => {
      // Przygotowanie mocka zwracającego sukces
      const mockSuccessResponse = {
        data: {
          user: { id: "123", email: "test@example.com" },
          session: {
            access_token: "test-token",
            expires_at: 123456,
            refresh_token: "refresh-token",
            user: { id: "123", email: "test@example.com" },
          },
        },
        error: null,
      } as AuthTokenResponsePassword;
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockSuccessResponse);

      // Wywołanie funkcji logowania
      await loginUser("test@example.com", "password123");

      // Weryfikacja
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
      expect(window.location.href).toBe("/generate");
    });

    // TC-02: Logowanie z błędnym hasłem → komunikat błędu
    it("TC-02: powinien obsłużyć błąd przy niepoprawnych danych logowania", async () => {
      // Przygotowanie mocka zwracającego błąd
      const mockErrorResponse = {
        data: {
          user: null,
          session: null,
        },
        error: {
          message: "Invalid login credentials",
          status: 400,
        },
      } as AuthTokenResponsePassword;
      vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue(mockErrorResponse);

      // Wywołanie funkcji i sprawdzenie czy wyrzuca błąd
      await expect(loginUser("test@example.com", "wrong_password")).rejects.toThrow("Niepoprawny email lub hasło");

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "wrong_password",
      });
      expect(window.location.href).not.toBe("/generate");
    });
  });

  // TC-03: Rejestracja nowego użytkownika → email potwierdzający → przekierowanie
  describe("registerUser", () => {
    it("TC-03: powinien zarejestrować nowego użytkownika i przekierować do strony logowania", async () => {
      // Przygotowanie mocków
      const mockSignUpResponse = {
        data: {
          user: { id: "123", email: "new@example.com" },
          session: null,
        },
        error: null,
      } as AuthResponse;

      const mockSignOutResponse = {
        error: null,
      } as AuthResponse;

      vi.mocked(supabase.auth.signUp).mockResolvedValue(mockSignUpResponse);
      vi.mocked(supabase.auth.signOut).mockResolvedValue(mockSignOutResponse);

      // Wywołanie funkcji rejestracji
      await registerUser("new@example.com", "password123");

      // Weryfikacja
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "new@example.com",
        password: "password123",
        options: {
          emailRedirectTo: "http://localhost:4321/auth/callback",
        },
      });
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(window.location.href).toBe("/auth/login?registration=success");
    });

    // TC-04: Rejestracja z istniejącym emailem → obsługa błędu
    it("TC-04: powinien obsłużyć błąd przy rejestracji z istniejącym emailem", async () => {
      // Przygotowanie mocka zwracającego błąd
      const mockErrorResponse = {
        data: {
          user: null,
          session: null,
        },
        error: {
          message: "User already registered",
          status: 400,
        },
      } as AuthResponse;
      vi.mocked(supabase.auth.signUp).mockResolvedValue(mockErrorResponse);

      // Wywołanie funkcji i sprawdzenie czy wyrzuca błąd
      await expect(registerUser("existing@example.com", "password123")).rejects.toThrow(
        "Użytkownik o tym adresie email już istnieje"
      );

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: "existing@example.com",
        password: "password123",
        options: {
          emailRedirectTo: "http://localhost:4321/auth/callback",
        },
      });
      expect(window.location.href).not.toBe("/auth/login?registration=success");
    });
  });

  // TC-05: Reset hasła – poprawny tok i niepoprawne dane
  describe("reset hasła", () => {
    it("TC-05a: powinien wysłać email z linkiem do resetowania hasła", async () => {
      // Przygotowanie mocka
      const mockResponse = {
        data: {} as Record<string, never>,
        error: null,
      } as { data: Record<string, never>; error: null };
      vi.mocked(supabase.auth.resetPasswordForEmail).mockResolvedValue(mockResponse);

      // Wywołanie funkcji
      await sendPasswordResetEmail("test@example.com");

      // Weryfikacja
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
        redirectTo: "http://localhost:4321/auth/reset-password",
      });
    });

    it("TC-05b: powinien zresetować hasło przy poprawnych danych", async () => {
      // Przygotowanie mocków
      const mockSessionResponse = {
        data: {
          session: {
            access_token: "test-token",
            expires_at: 123456,
            refresh_token: "refresh-token",
            user: { id: "123" },
          } as unknown as import("@supabase/supabase-js").Session,
        },
        error: null,
      };

      const mockUpdateResponse = {
        data: {
          user: { id: "123" },
        },
        error: null,
      } as UserResponse;

      vi.mocked(supabase.auth.getSession).mockResolvedValue(mockSessionResponse);
      vi.mocked(supabase.auth.updateUser).mockResolvedValue(mockUpdateResponse);

      // Wywołanie funkcji
      await resetPassword("new_password123", "new_password123");

      // Weryfikacja
      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: "new_password123",
      });
      expect(window.location.href).toBe("/auth/login?reset=success");
    });

    it("TC-05c: powinien wyrzucić błąd, gdy hasła nie pasują do siebie", async () => {
      // Wywołanie funkcji i sprawdzenie czy wyrzuca błąd
      await expect(resetPassword("password1", "password2")).rejects.toThrow("Hasła nie są identyczne");

      // Weryfikacja, że nie wywołano Supabase API
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it("TC-05d: powinien wyrzucić błąd, gdy hasło jest za krótkie", async () => {
      // Wywołanie funkcji i sprawdzenie czy wyrzuca błąd
      await expect(resetPassword("12345", "12345")).rejects.toThrow("Hasło musi mieć co najmniej 6 znaków");

      // Weryfikacja, że nie wywołano Supabase API
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it("TC-05e: powinien obsłużyć błąd braku sesji", async () => {
      // Przygotowanie mocka zwracającego brak sesji
      const mockNoSessionResponse = {
        data: {
          session: null,
        },
        error: null,
      } as { data: { session: null }; error: null };
      vi.mocked(supabase.auth.getSession).mockResolvedValue(mockNoSessionResponse);

      // Wywołanie funkcji i sprawdzenie czy wyrzuca błąd
      await expect(resetPassword("password123", "password123")).rejects.toThrow(
        "Brak aktywnej sesji. Spróbuj ponownie zresetować hasło."
      );

      // Weryfikacja, że nie wywołano Supabase API do aktualizacji hasła
      expect(supabase.auth.updateUser).not.toHaveBeenCalled();
    });
  });
});
