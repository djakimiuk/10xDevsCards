import type { APIRoute } from "astro";
import { z } from "zod";
import { FlashcardGeneratorService } from "../../../lib/services/flashcard-generator.service";
import { OpenRouterService } from "../../../lib/services/openrouter.service";
import { logger } from "../../../lib/logger";

// Validation schema for request body
const generateSchema = z.object({
  text: z
    .string()
    .min(100, "Text must be at least 100 characters long")
    .max(10000, "Text cannot exceed 10000 characters"),
});

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    logger.info("Generating flashcards");

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.error("Failed to parse request body", { error });
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid JSON format in request body",
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validationResult = generateSchema.safeParse(body);

    if (!validationResult.success) {
      logger.error("Validation failed", { errors: validationResult.error.errors });
      return new Response(
        JSON.stringify({
          error: {
            message: "Invalid input",
            details: validationResult.error.errors,
          },
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Ensure we have a proper Supabase client
    if (!locals.supabase) {
      logger.error("No Supabase instance in locals - this is likely a middleware issue");
      return new Response(
        JSON.stringify({
          error: {
            message: "Authentication error. Please log in again.",
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Initialize services
    try {
      const openRouter = new OpenRouterService();
      const flashcardGenerator = new FlashcardGeneratorService(openRouter, locals.supabase);

      // Generate flashcards
      const flashcards = await flashcardGenerator.generateFlashcards(validationResult.data.text);

      return new Response(JSON.stringify({ flashcards }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      // Log detailed error information
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      const errorName = error instanceof Error ? error.name : "UnknownError";
      const errorStack = error instanceof Error ? error.stack : "";

      logger.error("Error generating flashcards", {
        errorMessage,
        errorName,
        errorStack,
        error,
      });

      return new Response(
        JSON.stringify({
          error: {
            message: errorMessage,
            name: errorName,
          },
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    // Catch any unexpected errors in the main try block
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    const errorName = error instanceof Error ? error.name : "UnknownError";
    const errorStack = error instanceof Error ? error.stack : "No stack trace available";

    logger.error("Unexpected error in flashcard generation endpoint", {
      error,
      errorMessage,
    });

    return new Response(
      JSON.stringify({
        error: {
          message: errorMessage,
          name: errorName,
          stack: errorStack, // Include stack trace for more context if available
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
