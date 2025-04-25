import { afterEach, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";

// Automatically clean up after each test
afterEach(() => {
  cleanup();
});

// Set up global mocks if needed
// Example: vi.stubGlobal('fetch', vi.fn());

// Configure global fetch for tests if needed
global.fetch = vi.fn();

// Reset all mocks automatically after each test
afterEach(() => {
  vi.resetAllMocks();
});
