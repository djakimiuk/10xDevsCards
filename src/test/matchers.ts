import { expect } from "vitest";
import type { Session } from "@supabase/supabase-js";

declare module "vitest" {
  interface Assertion {
    toHaveAuthError(expected: string): void;
    toBeValidSession(): void;
  }

  interface AsymmetricMatchersContaining {
    toHaveAuthError(expected: string): void;
    toBeValidSession(): void;
  }
}

expect.extend({
  toHaveAuthError(received: string, expected: string) {
    const pass = received.includes(expected);
    return {
      pass,
      message: () =>
        pass
          ? `Expected "${received}" not to contain auth error "${expected}"`
          : `Expected "${received}" to contain auth error "${expected}"`,
    };
  },
  toBeValidSession(received: Partial<Session>) {
    const hasRequiredFields = received?.access_token && received?.refresh_token && received?.user?.id;

    return {
      pass: hasRequiredFields,
      message: () =>
        hasRequiredFields
          ? `Expected session not to be valid`
          : `Expected session to be valid, but missing required fields`,
    };
  },
});
