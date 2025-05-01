# Test info

- Name: Authentication >> should show login form
- Location: C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\auth.spec.ts:7:3

# Error details

```
Error: expect(page).toHaveScreenshot(expected)

  5013 pixels (ratio 0.01 of all image pixels) are different.

Expected: C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\auth.spec.ts-snapshots\login-page-chromium-win32.png
Received: C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\test-results\auth-Authentication-should-show-login-form-chromium\login-page-actual.png
    Diff: C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\test-results\auth-Authentication-should-show-login-form-chromium\login-page-diff.png

Call log:
  - expect.toHaveScreenshot(login-page.png) with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 5013 pixels (ratio 0.01 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 5013 pixels (ratio 0.01 of all image pixels) are different.

    at C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\auth.spec.ts:18:24
```

# Page snapshot

```yaml
- main:
  - heading "10x Devs Cards" [level=1]
  - heading "Zaloguj się do aplikacji" [level=2]
  - paragraph: Wprowadź swoje dane aby się zalogować
  - text: Email
  - textbox "Email"
  - text: Hasło
  - textbox "Hasło"
  - button "Zaloguj się"
  - link "Zapomniałeś hasła?":
    - /url: /auth/forgot-password
  - paragraph:
    - text: Nie masz jeszcze konta?
    - link "Zarejestruj się":
      - /url: /auth/register
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 | import LoginPage from "./pages/LoginPage";
   3 | import AuthPage from "./pages/AuthPage";
   4 | import { logger } from "../src/lib/logger";
   5 |
   6 | test.describe("Authentication", () => {
   7 |   test("should show login form", async ({ page }) => {
   8 |     const loginPage = new LoginPage(page);
   9 |     await loginPage.goto();
  10 |     await loginPage.waitForPageLoad();
  11 |
  12 |     // Verify form elements are visible
  13 |     await expect(loginPage.emailInput).toBeVisible();
  14 |     await expect(loginPage.passwordInput).toBeVisible();
  15 |     await expect(loginPage.submitButton).toBeVisible();
  16 |
  17 |     // Take a screenshot for visual testing
> 18 |     await expect(page).toHaveScreenshot("login-page.png");
     |                        ^ Error: expect(page).toHaveScreenshot(expected)
  19 |   });
  20 |
  21 |   test("should show error for invalid credentials", async ({ page }) => {
  22 |     const loginPage = new LoginPage(page);
  23 |     await loginPage.goto();
  24 |     await loginPage.waitForPageLoad();
  25 |
  26 |     // Try to login with invalid credentials
  27 |     await loginPage.login("invalid@example.com", "wrongpassword");
  28 |
  29 |     // Should show an error message
  30 |     await loginPage.expectLoginError();
  31 |   });
  32 |
  33 |   test("should login with valid credentials and redirect", async ({ page }) => {
  34 |     const loginPage = new LoginPage(page);
  35 |     await loginPage.goto();
  36 |     await loginPage.waitForPageLoad();
  37 |
  38 |     // Pobierz dane z zmiennych środowiskowych z .env.test
  39 |     const email = process.env.DEFAULT_USER_EMAIL;
  40 |     const password = process.env.DEFAULT_USER_PASSWORD;
  41 |     if (!email || !password) {
  42 |       throw new Error("Default user credentials not set in environment variables");
  43 |     }
  44 |
  45 |     // Log debug information
  46 |     logger.debug("Login credentials:", { email: email, password: password ? "***" : undefined });
  47 |
  48 |     // Zaloguj się używając danych testowych
  49 |     await loginPage.login(email, password);
  50 |
  51 |     // Poczekaj na przekierowanie do strony /generate
  52 |     await page.waitForURL(/\/generate$/, { timeout: 10000 });
  53 |
  54 |     // Dodatkowa asercja sprawdzająca, czy jesteśmy na stronie /generate
  55 |     expect(page.url()).toContain("/generate");
  56 |   });
  57 |
  58 |   test("should navigate to registration page", async ({ page }) => {
  59 |     const loginPage = new LoginPage(page);
  60 |     await loginPage.goto();
  61 |     await loginPage.waitForPageLoad();
  62 |
  63 |     // Click on the registration link
  64 |     await loginPage.registerLink.click();
  65 |
  66 |     // URL should be the registration page
  67 |     await expect(page).toHaveURL(/\/auth\/register$/);
  68 |   });
  69 |
  70 |   test("should handle authentication process", async ({ page }) => {
  71 |     const authPage = new AuthPage(page);
  72 |     if (!page || !authPage) {
  73 |       throw new Error("Page or AuthPage not initialized");
  74 |     }
  75 |     await authPage.goto();
  76 |     // ... rest of the test
  77 |   });
  78 | });
  79 |
```