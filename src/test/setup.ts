import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import "./matchers";

// Configure global test environment
beforeAll(() => {
  // Set required environment variables for tests
  process.env.PUBLIC_OPENROUTER_API_KEY = "test-api-key";
  process.env.VITEST = "true";
  process.env.TEST_MODE = "true";

  // Mock window.location with proper type safety
  const windowLocation = {
    href: "",
    pathname: "/",
    search: "",
    hash: "",
    host: "localhost:3000",
    hostname: "localhost",
    protocol: "http:",
    origin: "http://localhost:3000",
    port: "3000",
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  };

  Object.defineProperty(window, "location", {
    value: windowLocation,
    writable: true,
  });

  // Mock console methods with improved filtering
  const originalConsole = { ...console };
  const whitelistedWarnings = ["test-warning-whitelist"];
  const whitelistedErrors = ["test-error-whitelist"];

  vi.spyOn(console, "warn").mockImplementation((...args) => {
    if (whitelistedWarnings.some((warning) => args[0]?.includes(warning))) {
      return;
    }
    originalConsole.warn(...args);
  });

  vi.spyOn(console, "error").mockImplementation((...args) => {
    if (whitelistedErrors.some((error) => args[0]?.includes(error))) {
      return;
    }
    originalConsole.error(...args);
  });

  // Mock Supabase client with improved type safety and error handling
  vi.mock("@supabase/supabase-js", () => {
    class AuthError extends Error {
      status: number;
      constructor(message: string, status = 400) {
        super(message);
        this.name = "AuthError";
        this.status = status;
      }
    }

    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ data: null, error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
      })),
    };

    return {
      createClient: vi.fn(() => mockSupabaseClient),
      AuthError,
    };
  });

  // Mock Supabase SSR with consistent behavior
  vi.mock("@supabase/ssr", () => {
    const mockSupabaseClient = {
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
        signIn: vi.fn().mockResolvedValue({ data: null, error: null }),
        signOut: vi.fn().mockResolvedValue({ error: null }),
        signInWithPassword: vi.fn().mockResolvedValue({ data: null, error: null }),
        signUp: vi.fn().mockResolvedValue({ data: null, error: null }),
        resetPasswordForEmail: vi.fn().mockResolvedValue({ data: null, error: null }),
        updateUser: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockReturnThis(),
        update: vi.fn().mockReturnThis(),
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        count: vi.fn().mockReturnThis(),
      })),
    };

    return {
      createServerClient: vi.fn(() => mockSupabaseClient),
      createBrowserClient: vi.fn(() => mockSupabaseClient),
    };
  });
});

// Automatically clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.restoreAllMocks();

  // Reset window.location
  window.location.href = "";
  window.location.pathname = "/";
  window.location.search = "";
  window.location.hash = "";
});

// Configure global fetch mock with improved type safety
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(""),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Headers(),
  })
);
