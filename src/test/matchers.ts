import { expect } from "vitest";

interface CustomMatchers<R = unknown> {
  toHaveAuthError(expected: string): R;
  toBeValidSession(): R;
}

declare module "vitest" {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
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
  toBeValidSession(received: any) {
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
