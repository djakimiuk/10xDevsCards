# Test info

- Name: Flashcard Generation >> should show source text input form
- Location: C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\generate.spec.ts:32:3

# Error details

```
Error: expect(page).toHaveScreenshot(expected)

  2720 pixels (ratio 0.01 of all image pixels) are different.

Expected: C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\generate.spec.ts-snapshots\generate-page-chromium-win32.png
Received: C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\test-results\generate-Flashcard-Generat-4c116-show-source-text-input-form-chromium\generate-page-actual.png
    Diff: C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\test-results\generate-Flashcard-Generat-4c116-show-source-text-input-form-chromium\generate-page-diff.png

Call log:
  - expect.toHaveScreenshot(generate-page.png) with timeout 5000ms
    - verifying given screenshot expectation
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - 2720 pixels (ratio 0.01 of all image pixels) are different.
  - waiting 100ms before taking screenshot
  - taking page screenshot
    - disabled all CSS animations
  - waiting for fonts to load...
  - fonts loaded
  - captured a stable screenshot
  - 2720 pixels (ratio 0.01 of all image pixels) are different.

    at C:\Users\djaki\OneDrive\Documents\GitHub\10xDevsCards\e2e\generate.spec.ts:41:24
```

# Page snapshot

```yaml
- heading "Generate Flashcards with AI" [level=1]
- button "Wyloguj"
- text: Source Text
- textbox "Source Text"
- paragraph: 0/10000 characters
- button "Generate Flashcards"
```

# Test source

```ts
   1 | import { test, expect } from "@playwright/test";
   2 | import { logger } from "../src/lib/logger";
   3 | import LoginPage from "./pages/LoginPage";
   4 | import GeneratePage from "./pages/GeneratePage";
   5 |
   6 | test.describe("Flashcard Generation", () => {
   7 |   // Setup: login before each test
   8 |   test.beforeEach(async ({ page }) => {
   9 |     const loginPage = new LoginPage(page);
   10 |     await loginPage.goto();
   11 |     await loginPage.waitForPageLoad();
   12 |
   13 |     // Pobierz dane z zmiennych środowiskowych z .env.test
   14 |     const email = process.env.DEFAULT_USER_EMAIL;
   15 |     const password = process.env.DEFAULT_USER_PASSWORD;
   16 |     if (!email || !password) {
   17 |       throw new Error("Default user credentials not set in environment variables");
   18 |     }
   19 |
   20 |     // Sprawdź, czy zmienne są zdefiniowane
   21 |     expect(email).toBeDefined();
   22 |     expect(password).toBeDefined();
   23 |
   24 |     // Login with test credentials
   25 |     await loginPage.login(email, password);
   26 |
   27 |     // Poczekaj na przekierowanie do strony /generate
   28 |     await page.waitForURL(/\/generate$/, { timeout: 10000 });
   29 |     logger.debug("Successfully logged in, URL:", page.url());
   30 |   });
   31 |
   32 |   test("should show source text input form", async ({ page }) => {
   33 |     const generatePage = new GeneratePage(page);
   34 |     await generatePage.waitForPageLoad();
   35 |
   36 |     // Verify the form is visible
   37 |     await expect(generatePage.sourceTextInput).toBeVisible();
   38 |     await expect(generatePage.generateButton).toBeVisible();
   39 |
   40 |     // Take a screenshot for visual testing
>  41 |     await expect(page).toHaveScreenshot("generate-page.png");
      |                        ^ Error: expect(page).toHaveScreenshot(expected)
   42 |   });
   43 |
   44 |   test("should show validation error for too short text", async ({ page }) => {
   45 |     const generatePage = new GeneratePage(page);
   46 |     await generatePage.waitForPageLoad();
   47 |
   48 |     // Enter short text and try to generate
   49 |     await generatePage.enterSourceText("This is too short");
   50 |     await generatePage.clickGenerate();
   51 |
   52 |     // Should show validation error
   53 |     await generatePage.expectSourceTextError();
   54 |   });
   55 |
   56 |   test("should generate flashcards from valid text", async ({ page }) => {
   57 |     const generatePage = new GeneratePage(page);
   58 |     await generatePage.waitForPageLoad();
   59 |
   60 |     // Create a long enough text for generation (> 1000 characters)
   61 |     const longText = `
   62 |       Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
   63 |       Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
   64 |       Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
   65 |       Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
   66 |
   67 |       JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification.
   68 |       It is multi-paradigm, supporting event-driven, functional, and imperative programming styles.
   69 |
   70 |       React is a JavaScript library for building user interfaces. It allows developers to create large
   71 |       web applications that can change data, without reloading the page. The main purpose of React is
   72 |       to be fast, scalable, and simple.
   73 |
   74 |       TypeScript is a strict syntactical superset of JavaScript and adds optional static typing to the language.
   75 |       It is designed for the development of large applications and transcompiles to JavaScript.
   76 |
   77 |       Tailwind CSS is a utility-first CSS framework that provides a set of utility classes to style elements
   78 |       directly in the markup. It promotes a different way of styling compared to traditional approaches.
   79 |
   80 |       Playwright is a framework for Web Testing and Automation. It allows testing Chromium, Firefox and WebKit
   81 |       with a single API. Playwright is built to enable cross-browser web automation that is ever-green,
   82 |       capable, reliable and fast.
   83 |
   84 |       Continuous Integration (CI) is a development practice that requires developers to integrate code into
   85 |       a shared repository several times a day. Each check-in is then verified by an automated build, allowing
   86 |       teams to detect problems early.
   87 |     `.repeat(3); // Repeat to ensure we have enough text
   88 |
   89 |     // Generate flashcards
   90 |     await generatePage.generateFlashcards(longText);
   91 |
   92 |     // Should show loading indicator initially
   93 |     await generatePage.expectGenerationLoading();
   94 |
   95 |     // Wait for generation to complete (may take some time)
   96 |     await generatePage.waitForGenerationComplete();
   97 |
   98 |     // Should show candidates after generation
   99 |     await generatePage.expectCandidatesVisible();
  100 |
  101 |     // Select a few candidates and save them
  102 |     // We need to extract the actual IDs from the page
  103 |     const cardIds = await page.evaluate(() => {
  104 |       const cards = Array.from(document.querySelectorAll('[data-test-id^="candidate-card-"]'));
  105 |       return cards
  106 |         .map((card) => {
  107 |           const id = card.getAttribute("data-test-id")?.replace("candidate-card-", "");
  108 |           return id;
  109 |         })
  110 |         .filter(Boolean)
  111 |         .slice(0, 3); // Take first 3 cards
  112 |     });
  113 |
  114 |     // Log information about found cards
  115 |     logger.debug(`Found ${cardIds.length} cards with IDs:`, cardIds);
  116 |
  117 |     // Accept the first 2 cards if available
  118 |     if (cardIds.length >= 2) {
  119 |       await generatePage.acceptCandidate(cardIds[0]);
  120 |       await generatePage.acceptCandidate(cardIds[1]);
  121 |
  122 |       // And save only accepted flashcards
  123 |       await generatePage.saveAcceptedFlashcards();
  124 |
  125 |       // Take a screenshot of the final state
  126 |       await expect(page).toHaveScreenshot("generated-flashcards.png");
  127 |     } else {
  128 |       // If no candidates were generated, fail the test
  129 |       expect(cardIds.length).toBeGreaterThan(0, "No flashcard candidates were generated");
  130 |     }
  131 |   });
  132 |
  133 |   test("should handle generation process", async ({ page }) => {
  134 |     const generatePage = new GeneratePage(page);
  135 |     if (!page || !generatePage) {
  136 |       throw new Error("Page or GeneratePage not initialized");
  137 |     }
  138 |     await generatePage.goto();
  139 |     // ... rest of the test
  140 |   });
  141 | });
```
