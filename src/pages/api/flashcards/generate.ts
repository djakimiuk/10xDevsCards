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
    } catch {
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

    // Initialize services
    const openRouter = new OpenRouterService();
    const flashcardGenerator = new FlashcardGeneratorService(openRouter, locals.supabase);

    // Generate flashcards
    const flashcards = await flashcardGenerator.generateFlashcards(validationResult.data.text);

    return new Response(JSON.stringify({ flashcards }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Error generating flashcards", { error });
    return new Response(
      JSON.stringify({
        error: {
          message: error instanceof Error ? error.message : "An unexpected error occurred",
        },
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
