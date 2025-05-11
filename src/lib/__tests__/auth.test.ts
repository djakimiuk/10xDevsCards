import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { loginUser, registerUser, sendPasswordResetEmail, updateUserPassword, logoutUser } from "../auth";
import { type User, type Session, AuthError } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

// Mock @supabase/ssr module
vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(),
}));

// Define a more specific type for the mocked Supabase client parts we use
interface MockAuth {
  signInWithPassword: ReturnType<typeof vi.fn>;
  signUp: ReturnType<typeof vi.fn>;
  resetPasswordForEmail: ReturnType<typeof vi.fn>;
  updateUser: ReturnType<typeof vi.fn>;
  signOut: ReturnType<typeof vi.fn>;
  getSession: ReturnType<typeof vi.fn>;
}

interface MockSupabase {
  auth: MockAuth;
}

describe("Auth functions", () => {
  let supabase: MockSupabase;
  let windowLocationSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Properly mock window.location
    const mockLocation = {
      href: "",
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      toString: vi.fn(),
      ancestorOrigins: {} as DOMStringList,
      hash: "",
      host: "localhost:3000",
      hostname: "localhost",
      origin: "http://localhost:3000",
      pathname: "/",
      port: "3000",
      protocol: "http:",
      search: "",
    };

    windowLocationSpy = vi.spyOn(window, "location", "get").mockReturnValue(mockLocation);

    // Stub environment variables used by createBrowserClient in auth.ts
    vi.stubEnv("PUBLIC_SUPABASE_URL", "http://localhost:54321");
    vi.stubEnv("PUBLIC_SUPABASE_ANON_KEY", "mock-anon-key");

    supabase = {
      auth: {
        signInWithPassword: vi.fn(),
        signUp: vi.fn(),
        resetPasswordForEmail: vi.fn(),
        updateUser: vi.fn(),
        signOut: vi.fn(),
        getSession: vi.fn(),
      },
    };

    (createBrowserClient as unknown as ReturnType<typeof vi.fn>).mockReturnValue(supabase);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    windowLocationSpy.mockRestore();
  });

  describe("loginUser", () => {
    const mockSession: Session = {
      access_token: "mock-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh",
      user: {
        id: "123",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: "",
      },
      expires_at: 123456,
    };

    it("should login user successfully and redirect", async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      await loginUser("test@example.com", "password");
      expect(window.location.href).toBe("/dashboard");
      expect(mockSession).toBeValidSession();
    });

    it("should throw friendly error for 'Invalid login credentials'", async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: new AuthError("Invalid login credentials"),
      });

      const loginPromise = loginUser("test@example.com", "password");
      await expect(loginPromise).rejects.toThrow();

      try {
        await loginPromise;
      } catch (error: unknown) {
        if (error instanceof Error) {
          expect(error.message).toHaveAuthError("Niepoprawny email lub hasło");
        } else {
          throw new Error("Expected error to be instance of Error");
        }
      }
    });

    it("should throw default friendly error on unknown login failure", async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: new Error("Unknown error"),
      });

      await expect(loginUser("test@example.com", "password")).rejects.toThrow(
        "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później"
      );
    });

    it("should throw friendly error if no session after login", async () => {
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(loginUser("test@example.com", "password")).rejects.toThrow("Nie udało się utworzyć sesji");
    });
  });

  describe("registerUser", () => {
    const mockUser: User = {
      id: "123",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: "",
    };

    it("should register user successfully", async () => {
      const registerResponse = {
        data: { user: mockUser, session: null },
        error: null,
      };

      supabase.auth.signUp.mockResolvedValue(registerResponse);

      await registerUser("test@example.com", "password");
      expect(window.location.href).toBe("/auth/login");

      // Use inline snapshot for the registration response
      expect(registerResponse).toMatchInlineSnapshot(`
        {
          "data": {
            "session": null,
            "user": {
              "app_metadata": {},
              "aud": "authenticated",
              "created_at": "",
              "id": "123",
              "user_metadata": {},
            },
          },
          "error": null,
        }
      `);
    });

    it("should throw friendly error for 'User already registered'", async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new AuthError("User already registered"),
      });

      await expect(registerUser("test@example.com", "password")).rejects.toThrow(
        "Użytkownik o tym adresie email już istnieje"
      );
    });

    it("should throw default friendly error on unknown registration failure", async () => {
      supabase.auth.signUp.mockResolvedValue({
        data: { user: null, session: null },
        error: new Error("Unknown error"),
      });

      await expect(registerUser("test@example.com", "password")).rejects.toThrow(
        "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później"
      );
    });
  });

  describe("sendPasswordResetEmail", () => {
    it("should send reset password email successfully", async () => {
      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: {},
        error: null,
      });

      await expect(sendPasswordResetEmail("test@example.com")).resolves.not.toThrow();
    });

    it("should throw default friendly error on reset password email failure", async () => {
      supabase.auth.resetPasswordForEmail.mockResolvedValue({
        data: null,
        error: new Error("Reset password failed"),
      });

      await expect(sendPasswordResetEmail("test@example.com")).rejects.toThrow(
        "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później"
      );
    });
  });

  describe("updateUserPassword", () => {
    const mockSession: Session = {
      access_token: "mock-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh",
      user: {
        id: "123",
        app_metadata: {},
        user_metadata: {},
        aud: "authenticated",
        created_at: "",
      },
      expires_at: 123456,
    };

    it("should update password successfully and redirect", async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      supabase.auth.updateUser.mockResolvedValue({
        data: { user: mockSession.user },
        error: null,
      });

      await updateUserPassword("newpassword123", "newpassword123");
      expect(window.location.href).toBe("/dashboard");
    });

    it("should throw friendly error for password mismatch", async () => {
      await expect(updateUserPassword("password1", "password2")).rejects.toThrow("Hasła nie są identyczne");
    });

    it("should throw friendly error for short password", async () => {
      await expect(updateUserPassword("short", "short")).rejects.toThrow("Hasło musi mieć co najmniej 6 znaków");
    });

    it("should throw friendly error if no active session", async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      await expect(updateUserPassword("newpassword123", "newpassword123")).rejects.toThrow(
        "Brak aktywnej sesji. Spróbuj ponownie zresetować hasło."
      );
    });

    it("should throw friendly error on session fetch failure", async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error("Session fetch failed"),
      });

      await expect(updateUserPassword("newpassword123", "newpassword123")).rejects.toThrow("Brak aktywnej sesji");
    });

    it("should throw friendly error on password update failure", async () => {
      supabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      supabase.auth.updateUser.mockResolvedValue({
        data: { user: null },
        error: new Error("Password update failed"),
      });

      await expect(updateUserPassword("newpassword123", "newpassword123")).rejects.toThrow(
        "Wystąpił nieoczekiwany błąd. Spróbuj ponownie później"
      );
    });
  });

  describe("logoutUser", () => {
    it("should sign out user successfully and redirect", async () => {
      supabase.auth.signOut.mockResolvedValue({ error: null });
      await logoutUser();
      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(window.location.href).toBe("/auth/login");
    });

    it("should throw friendly error on sign out failure", async () => {
      supabase.auth.signOut.mockResolvedValue({
        error: new Error("Logout failed in Supabase"),
      });

      await expect(logoutUser()).rejects.toThrow("Wystąpił błąd podczas wylogowywania");
    });
  });
});
