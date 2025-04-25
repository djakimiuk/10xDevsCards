# Testing Documentation for 10xDevsCards

This project uses Vitest for unit testing and Playwright for E2E testing.

## Unit Testing with Vitest

The unit tests are located in the `src` directory, alongside the code they test, with a `.test.ts` or `.test.tsx` suffix.

### Running Unit Tests

```bash
# Run tests once
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Open UI for tests
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Creating Unit Tests

1. Create a test file next to the component/module you want to test, with a `.test.ts` or `.test.tsx` suffix
2. Import the necessary testing utilities:

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { YourComponent } from "./your-component";
```

3. Write your tests using the Testing Library syntax:

```tsx
describe("YourComponent", () => {
  it("should render correctly", () => {
    render(<YourComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });
});
```

4. For mocking, use the `vi` object:

```tsx
// Mock a function
const mockFn = vi.fn();

// Mock a module
vi.mock("./your-module", () => ({
  yourFunction: vi.fn().mockReturnValue("mocked result"),
}));
```

## E2E Testing with Playwright

The E2E tests are located in the `e2e` directory, with a `.spec.ts` suffix.

### Running E2E Tests

```bash
# Install browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI debug mode
npm run test:e2e:debug

# Generate tests using codegen
npm run test:e2e:codegen
```

### Creating E2E Tests

1. For best practice, use the Page Object Model pattern
2. Create Page Objects in `e2e/pages/` directory
3. Create test files in the `e2e` directory with a `.spec.ts` suffix

Example of a test file:

```ts
import { test, expect } from "@playwright/test";
import HomePage from "./pages/HomePage";

test("homepage should have the expected title", async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.expectPageTitle("Expected Title");
});
```

### Visual Testing

Playwright includes support for visual testing with screenshots:

```ts
// Take a screenshot and compare it with baseline
await expect(page).toHaveScreenshot("screenshot-name.png");
```

## Continuous Integration

Tests are automatically run in CI/CD pipelines. Make sure your tests pass locally before pushing changes.

## Best Practices

1. Write tests that are deterministic and don't depend on external services
2. Use mocks for external dependencies
3. Focus on testing behavior, not implementation details
4. Keep tests simple and readable
5. For UI components, test from the user's perspective
