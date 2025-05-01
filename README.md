# AI Flashcard Generator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An AI-powered web application designed to help users, especially programming learners, efficiently create educational flashcards from text content.

## Table of Contents

- [Project Description](#project-description)
- [Tech Stack](#tech-stack)
- [Getting Started Locally](#getting-started-locally)
- [Available Scripts](#available-scripts)
- [Project Scope (MVP)](#project-scope-mvp)
- [Project Status](#project-status)
- [License](#license)

## Project Description

AI Flashcard Generator utilizes AI (specifically the Gemini Flash model via OpenRouter.ai) to automatically generate flashcards based on user-provided text (e.g., documentation, articles, notes). This significantly reduces the manual effort required for flashcard creation. Users can also create flashcards manually, manage their sets, and utilize a spaced repetition learning method through integration with an open-source library. The Minimum Viable Product (MVP) focuses on core generation, management, and learning functionalities with a simple user account system. TEST PR.

## Tech Stack

- **Frontend:**
  - [Astro 5](https://astro.build/): High-performance site generation.
  - [React 19](https://react.dev/): Interactive UI components.
  - [TypeScript 5](https://www.typescriptlang.org/): Static typing.
  - [Tailwind 4](https://tailwindcss.com/): Utility-first CSS framework.
  - [Shadcn/ui](https://ui.shadcn.com/): Accessible React components.
- **Backend:**
  - [Supabase](https://supabase.com/): Backend-as-a-Service (PostgreSQL Database, Authentication, SDKs).
- **AI:**
  - [Gemini Flash](https://deepmind.google/technologies/gemini/flash/) (via [OpenRouter.ai](https://openrouter.ai/)): AI model for flashcard generation.
- **CI/CD & Hosting:**
  - [GitHub Actions](https://github.com/features/actions): Continuous Integration & Deployment pipelines.
  - [DigitalOcean](https://www.digitalocean.com/): Application hosting (via Docker).
- **Testing:**
  - [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/): Unit testing React components and functions.
  - [Playwright](https://playwright.dev/): End-to-end (E2E) testing and browser automation.
  - [MSW](https://mswjs.io/): Mock Service Worker for API mocking in tests.
  - [axe-core](https://github.com/dequelabs/axe-core): Accessibility testing integrated with Playwright.
  - [Storybook](https://storybook.js.org/): Component development and UI testing.
  - [Chromatic](https://www.chromatic.com/): Visual regression testing.

## Getting Started Locally

To set up and run the project locally, follow these steps:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/10xDevsCards.git
    cd 10xDevsCards
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install / pnpm install
    ```
3.  **Set up environment variables:**
    - Create a `.env` file in the root directory.
    - Add the necessary environment variables (e.g., Supabase URL, Supabase Anon Key, OpenRouter API Key). Refer to `.env.example` if available (Note: `.env.example` needs to be created).
    ```plaintext
    # .env
    PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
    PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
    OPENROUTER_API_KEY=YOUR_OPENROUTER_API_KEY
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The application should now be running on `http://localhost:4321` (or the port specified by Astro).

## Available Scripts

In the project directory, you can run the following scripts:

- `npm run dev`: Starts the development server with hot reloading.
- `npm run build`: Builds the application for production.
- `npm run preview`: Serves the production build locally for previewing.
- `npm run astro`: Accesses the Astro CLI for various commands.
- `npm run lint`: Lints the codebase using ESLint.
- `npm run lint:fix`: Lints the codebase and automatically fixes fixable issues.
- `npm run format`: Formats the codebase using Prettier.

## Project Scope (MVP)

The current focus is on delivering the Minimum Viable Product (MVP) with the following core features:

- **User Accounts:** Registration and Login.
- **AI Generation:** Generate flashcards from text (1k-10k chars) using Gemini Flash.
- **AI Review:** Review, accept, edit, or reject AI-generated flashcard suggestions.
- **Manual Creation:** Manually create and save flashcards.
- **Management:** View, edit, and delete saved flashcards.
- **Spaced Repetition:** Integrate an open-source SR library for learning sessions.
- **Basic Error Handling:** User-friendly error messages.

**Out of Scope for MVP:**

- Advanced/custom Spaced Repetition algorithms.
- Importing from file formats other than pasted text.
- Social features (sharing, public decks).
- External platform integrations (LMS, etc.).
- Dedicated mobile applications.
- Advanced text formatting in flashcards (beyond basic code blocks).
- Third-party authentication providers (Google, GitHub).
- Cost monitoring/optimization for AI API calls.
- Advanced learning analytics.
- Automatic text processing (truncation/summarization) for input outside limits.

## Project Status

This project is currently in the **Minimum Viable Product (MVP) development phase**. Features are actively being developed and refined.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details (Note: `LICENSE` file needs to be created).
