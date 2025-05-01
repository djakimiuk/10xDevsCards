import { test, expect } from "@playwright/test";
import { logger } from "../src/lib/logger";
import LoginPage from "./pages/LoginPage";
import GeneratePage from "./pages/GeneratePage";

test.describe("Flashcard Generation", () => {
  // Setup: login before each test
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.waitForPageLoad();

    // Pobierz dane z zmiennych środowiskowych z .env.test
    const email = process.env.DEFAULT_USER_EMAIL;
    const password = process.env.DEFAULT_USER_PASSWORD;
    if (!email || !password) {
      throw new Error("Default user credentials not set in environment variables");
    }

    // Sprawdź, czy zmienne są zdefiniowane
    expect(email).toBeDefined();
    expect(password).toBeDefined();

    // Login with test credentials
    await loginPage.login(email, password);

    // Poczekaj na przekierowanie do strony /generate
    await page.waitForURL(/\/generate$/, { timeout: 10000 });
    logger.debug("Successfully logged in, URL:", page.url());
  });

  test("should show source text input form", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Verify the form is visible
    await expect(generatePage.sourceTextInput).toBeVisible();
    await expect(generatePage.generateButton).toBeVisible();

    // Take a screenshot for visual testing
    await expect(page).toHaveScreenshot("generate-page.png");
  });

  test("should show validation error for too short text", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Enter short text and try to generate
    await generatePage.enterSourceText("This is too short");
    await generatePage.clickGenerate();

    // Should show validation error
    await generatePage.expectSourceTextError();
  });

  test("should generate flashcards from valid text", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    await generatePage.waitForPageLoad();

    // Create a long enough text for generation (> 1000 characters)
    const longText = `
      Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
      Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. 
      Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
      Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
      
      JavaScript is a high-level, interpreted programming language that conforms to the ECMAScript specification. 
      It is multi-paradigm, supporting event-driven, functional, and imperative programming styles.
      
      React is a JavaScript library for building user interfaces. It allows developers to create large 
      web applications that can change data, without reloading the page. The main purpose of React is 
      to be fast, scalable, and simple.
      
      TypeScript is a strict syntactical superset of JavaScript and adds optional static typing to the language. 
      It is designed for the development of large applications and transcompiles to JavaScript.
      
      Tailwind CSS is a utility-first CSS framework that provides a set of utility classes to style elements 
      directly in the markup. It promotes a different way of styling compared to traditional approaches.
      
      Playwright is a framework for Web Testing and Automation. It allows testing Chromium, Firefox and WebKit 
      with a single API. Playwright is built to enable cross-browser web automation that is ever-green, 
      capable, reliable and fast.
      
      Continuous Integration (CI) is a development practice that requires developers to integrate code into 
      a shared repository several times a day. Each check-in is then verified by an automated build, allowing 
      teams to detect problems early.
    `.repeat(3); // Repeat to ensure we have enough text

    // Generate flashcards
    await generatePage.generateFlashcards(longText);

    // Should show loading indicator initially
    await generatePage.expectGenerationLoading();

    // Wait for generation to complete (may take some time)
    await generatePage.waitForGenerationComplete();

    // Should show candidates after generation
    await generatePage.expectCandidatesVisible();

    // Select a few candidates and save them
    // We need to extract the actual IDs from the page
    const cardIds = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll('[data-test-id^="candidate-card-"]'));
      return cards
        .map((card) => {
          const id = card.getAttribute("data-test-id")?.replace("candidate-card-", "");
          return id;
        })
        .filter(Boolean)
        .slice(0, 3); // Take first 3 cards
    });

    // Log information about found cards
    logger.debug(`Found ${cardIds.length} cards with IDs:`, cardIds);

    // Accept the first 2 cards if available
    if (cardIds.length >= 2) {
      await generatePage.acceptCandidate(cardIds[0]);
      await generatePage.acceptCandidate(cardIds[1]);

      // And save only accepted flashcards
      await generatePage.saveAcceptedFlashcards();

      // Take a screenshot of the final state
      await expect(page).toHaveScreenshot("generated-flashcards.png");
    } else {
      // If no candidates were generated, fail the test
      expect(cardIds.length).toBeGreaterThan(0, "No flashcard candidates were generated");
    }
  });

  test("should handle generation process", async ({ page }) => {
    const generatePage = new GeneratePage(page);
    if (!page || !generatePage) {
      throw new Error("Page or GeneratePage not initialized");
    }
    await generatePage.goto();
    // ... rest of the test
  });
});
