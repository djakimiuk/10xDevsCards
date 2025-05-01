# Test info

- Name: Authentication >> should show error for invalid credentials
- Location: C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\auth.spec.ts:21:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toBeVisible()

Locator: locator('[data-test-id="login-error-alert"]')
Expected: visible
Received: <element(s) not found>
Call log:
  - expect.toBeVisible with timeout 5000ms
  - waiting for locator('[data-test-id="login-error-alert"]')

    at LoginPage.expectLoginError (C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\pages\LoginPage.ts:52:35)
    at C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\auth.spec.ts:30:21
```

# Page snapshot

```yaml
- main:
    - heading "10x Devs Cards" [level=1]
    - heading "Zaloguj się do aplikacji" [level=2]
    - paragraph: Wprowadź swoje dane aby się zalogować
    - alert: Niepoprawny email lub hasło
    - text: Email
    - textbox "Email": invalid@example.com
    - text: Hasło
    - textbox "Hasło": wrongpassword
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
   1 | import { Page, expect } from "@playwright/test";
   2 | import BasePage from "./BasePage";
   3 |
   4 | export default class LoginPage extends BasePage {
   5 |   constructor(page: Page) {
   6 |     super(page, "/auth/login");
   7 |   }
   8 |
   9 |   // Locators
  10 |   get emailInput() {
  11 |     return this.page.locator('[data-test-id="login-email-input"]');
  12 |   }
  13 |
  14 |   get passwordInput() {
  15 |     return this.page.locator('[data-test-id="login-password-input"]');
  16 |   }
  17 |
  18 |   get submitButton() {
  19 |     return this.page.locator('[data-test-id="login-submit-button"]');
  20 |   }
  21 |
  22 |   get errorAlert() {
  23 |     return this.page.locator('[data-test-id="login-error-alert"]');
  24 |   }
  25 |
  26 |   get registrationSuccessAlert() {
  27 |     return this.page.locator('[data-test-id="registration-success-alert"]');
  28 |   }
  29 |
  30 |   get registerLink() {
  31 |     return this.page.locator('[data-test-id="register-link"]');
  32 |   }
  33 |
  34 |   get forgotPasswordLink() {
  35 |     return this.page.locator('[data-test-id="forgot-password-link"]');
  36 |   }
  37 |
  38 |   // Actions
  39 |   async login(email: string, password: string) {
  40 |     await this.emailInput.fill(email);
  41 |     await this.passwordInput.fill(password);
  42 |     await this.submitButton.click();
  43 |   }
  44 |
  45 |   async waitForPageLoad() {
  46 |     await super.waitForPageLoad();
  47 |     await this.emailInput.waitFor({ state: "visible" });
  48 |   }
  49 |
  50 |   // Assertions
  51 |   async expectLoginError() {
> 52 |     await expect(this.errorAlert).toBeVisible();
     |                                   ^ Error: Timed out 5000ms waiting for expect(locator).toBeVisible()
  53 |   }
  54 |
  55 |   async expectRegistrationSuccess() {
  56 |     await expect(this.registrationSuccessAlert).toBeVisible();
  57 |   }
  58 |
  59 |   async expectRedirectAfterLogin() {
  60 |     // Checking that we're redirected away from login page
  61 |     await expect(this.emailInput).not.toBeVisible({ timeout: 5000 });
  62 |   }
  63 | }
  64 |
```
