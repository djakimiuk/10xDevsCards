import { afterEach, beforeAll, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import "./matchers";
import { Logger } from "../lib/logger";

const logger = new Logger("TEST");

// Configure global test environment
beforeAll(() => {
  // Add logging to check environment variables
  logger.debug("Test Environment Variables:", {
    SUPABASE_URL: process.env.SUPABASE_URL,
    PUBLIC_SUPABASE_URL: process.env.PUBLIC_SUPABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    VITEST: process.env.VITEST,
    TEST_MODE: process.env.TEST_MODE,
  });

  // Mock window.location
  const windowLocation = { href: "" };
  Object.defineProperty(window, "location", {
    value: windowLocation,
    writable: true,
  });

  // Mock console methods to catch warnings/errors
  const originalConsole = { ...console };
  vi.spyOn(console, "warn").mockImplementation((...args) => {
    if (args[0]?.includes("test-warning-whitelist")) {
      return;
    }
    originalConsole.warn(...args);
  });

  vi.spyOn(console, "error").mockImplementation((...args) => {
    if (args[0]?.includes("test-error-whitelist")) {
      return;
    }
    originalConsole.error(...args);
  });
});

// Automatically clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.resetAllMocks();

  // Reset window.location
  window.location.href = "";
});

// Configure global fetch mock
global.fetch = vi.fn();
