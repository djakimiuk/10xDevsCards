import { test, expect } from "@playwright/test";
import LoginPage from "./pages/LoginPage";

test.describe("Authentication", () => {
  test("should show login form", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForPageLoad();

    // Verify form elements are visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();

    // Take a screenshot for visual testing
    await expect(page).toHaveScreenshot("login-page.png");
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
    const testEmail = process.env.DEFAULT_USER_EMAIL;
    const testPassword = process.env.DEFAULT_USER_PASSWORD;

    // Sprawdź, czy zmienne są zdefiniowane
    console.log("Dane do logowania:", { email: testEmail, password: testPassword ? "***" : undefined });
    expect(testEmail).toBeDefined();
    expect(testPassword).toBeDefined();

    // Zaloguj się używając danych testowych
    await loginPage.login(testEmail!, testPassword!);

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
});
