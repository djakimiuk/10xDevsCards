# Test info

- Name: Login page tests >> should display the homepage
- Location: C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\home.spec.ts:45:3

# Error details

```
Error: Timed out 5000ms waiting for expect(locator).toHaveText(expected)

Locator: locator('title')
Expected string: "10xDevsCards"
Received string: ""
Call log:
  - expect.toHaveText with timeout 5000ms
  - waiting for locator('title')
    9 × locator resolved to <title>Login - 10xDevsCards</title>
      - unexpected value ""

    at HomePage.expectPageTitle (C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\pages\HomePage.ts:56:34)
    at C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\home.spec.ts:48:20
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
   1 | import type { Page, Locator } from "@playwright/test";
   2 | import { expect } from "@playwright/test";
   3 | import { logger } from "../../src/lib/logger";
   4 | import BasePage from "./BasePage";
   5 |
   6 | /**
   7 |  * HomePage page object for testing the home page
   8 |  */
   9 | export default class HomePage extends BasePage {
  10 |   // Define locators for elements on the page
  11 |   readonly pageTitle: Locator;
  12 |   readonly loginForm: Locator;
  13 |   readonly emailInput: Locator;
  14 |   readonly passwordInput: Locator;
  15 |   readonly loginButton: Locator;
  16 |   readonly errorMessage: Locator;
  17 |   readonly forgotPasswordLink: Locator;
  18 |   readonly registerLink: Locator;
  19 |
  20 |   constructor(page: Page) {
  21 |     // Pass the page and the URL to the base class
  22 |     super(page, "/");
  23 |
  24 |     // Initialize locators
  25 |     this.pageTitle = page.locator("title");
  26 |     this.loginForm = page.locator("form");
  27 |     this.emailInput = page.locator('input[type="email"]');
  28 |     this.passwordInput = page.locator('input[type="password"]');
  29 |     this.loginButton = page.locator('button[type="submit"]');
  30 |     this.errorMessage = page.locator('[data-test-id="login-error"]');
  31 |     this.forgotPasswordLink = page.locator('a[href="/auth/forgot-password"]');
  32 |     this.registerLink = page.locator('a[href="/auth/register"]');
  33 |   }
  34 |
  35 |   /**
  36 |    * Override waitForPageLoad to check for specific elements on this page
  37 |    */
  38 |   async waitForPageLoad() {
  39 |     await this.loginForm.waitFor();
  40 |     await super.waitForPageLoad();
  41 |   }
  42 |
  43 |   /**
  44 |    * Login with credentials
  45 |    */
  46 |   async login(email: string, password: string) {
  47 |     await this.emailInput.fill(email);
  48 |     await this.passwordInput.fill(password);
  49 |     await this.loginButton.click();
  50 |   }
  51 |
  52 |   /**
  53 |    * Check if the page title is correct
  54 |    */
  55 |   async expectPageTitle(expectedTitle: string) {
> 56 |     await expect(this.pageTitle).toHaveText(expectedTitle);
     |                                  ^ Error: Timed out 5000ms waiting for expect(locator).toHaveText(expected)
  57 |   }
  58 |
  59 |   /**
  60 |    * Check if the login form is displayed
  61 |    */
  62 |   async expectLoginFormVisible() {
  63 |     await expect(this.loginForm).toBeVisible();
  64 |   }
  65 |
  66 |   /**
  67 |    * Navigate to register page
  68 |    */
  69 |   async goToRegister() {
  70 |     await this.registerLink.click();
  71 |   }
  72 |
  73 |   /**
  74 |    * Navigate to forgot password page
  75 |    */
  76 |   async goToForgotPassword() {
  77 |     await this.forgotPasswordLink.click();
  78 |   }
  79 |
  80 |   /**
  81 |    * Debug method to log all links on the page
  82 |    */
  83 |   async debugLinks() {
  84 |     const html = await this.page.content();
  85 |     logger.debug("HTML Structure:", html.substring(0, 500) + "...");
  86 |
  87 |     const allLinks = await this.page.locator("a").all();
  88 |     for (const link of allLinks) {
  89 |       const text = await link.textContent();
  90 |       const href = await link.getAttribute("href");
  91 |       logger.debug(`Link: Text="${text}", href="${href}"`);
  92 |     }
  93 |   }
  94 | }
  95 |
```