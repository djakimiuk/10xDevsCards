import { test, expect } from "@playwright/test";
import LoginPage from "./pages/LoginPage";
import AuthPage from "./pages/AuthPage";
import { logger } from "../src/lib/logger";

test.describe("Authentication", () => {
  test.beforeEach(async ({ context }) => {
    // Start tracing for all tests in this describe block
    await context.tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });
  });

  test.afterEach(async ({ context }, testInfo) => {
    // Stop tracing and save to test-results directory
    await context.tracing.stop({
      path: `./test-results/traces/${testInfo.title.replace(/\s+/g, "-")}.zip`,
    });
  });

  test("should show login form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForPageLoad();

    // Verify form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();

    // Take a screenshot for visual testing with masking
    await page.evaluate(() => {
      // Remove any dynamic content that might change between runs
      const dynamicElements = document.querySelectorAll('[data-testid="dynamic-content"]');
      dynamicElements.forEach((el) => el.remove());
    });

    expect(
      await page.screenshot({
        mask: [loginPage.emailInput, loginPage.passwordInput],
        animations: "disabled",
      })
    ).toMatchSnapshot("login-page.png");
  });

  test("should show error for invalid credentials", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForPageLoad();

    // Try to login with invalid credentials
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Should show an error message
    await loginPage.expectLoginError();
  });

  test("should login with valid credentials and redirect", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForPageLoad();

    // Pobierz dane z zmiennych środowiskowych z .env.test
    const email = process.env.DEFAULT_USER_EMAIL;
    const password = process.env.DEFAULT_USER_PASSWORD;
    if (!email || !password) {
      throw new Error("Default user credentials not set in environment variables");
    }

    // Log debug information
    logger.debug("Login credentials:", { email: email, password: password ? "***" : undefined });

    // Zaloguj się używając danych testowych
    await loginPage.login(email, password);

    // Poczekaj na przekierowanie do strony /generate
    await page.waitForURL(/\/generate$/, { timeout: 10000 });

    // Dodatkowa asercja sprawdzająca, czy jesteśmy na stronie /generate
    expect(page.url()).toContain("/generate");
  });

  test("should navigate to registration page", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForPageLoad();

    // Click on the registration link
    await loginPage.registerLink.click();

    // URL should be the registration page
    await expect(page).toHaveURL(/\/auth\/register$/);
  });

  test("should handle authentication process", async ({ page }) => {
    const authPage = new AuthPage(page);
    if (!page || !authPage) {
      throw new Error("Page or AuthPage not initialized");
    }
    await authPage.goto();
    // ... rest of the test
  });

  test("should handle complete authentication flow", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const authPage = new AuthPage(page);

    // Start recording a trace for this specific test
    await page.context().tracing.start({
      screenshots: true,
      snapshots: true,
      sources: true,
    });

    try {
      await loginPage.goto();
      await loginPage.waitForPageLoad();

      // Test registration flow
      await loginPage.registerLink.click();
      await expect(page).toHaveURL(/\/auth\/register$/);

      // Test login flow
      await loginPage.goto();
      await loginPage.login(process.env.DEFAULT_USER_EMAIL || "", process.env.DEFAULT_USER_PASSWORD || "");
      await expect(page).toHaveURL(/\/generate$/);

      // Test logout flow
      await authPage.logout();
      await expect(page).toHaveURL(/\/auth\/login$/);
    } finally {
      // Save trace for this specific test
      await page.context().tracing.stop({
        path: `./test-results/traces/complete-auth-flow.zip`,
      });
    }
  });
});
