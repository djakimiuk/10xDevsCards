import type { APIContext } from "astro";
import { z } from "zod";
import type { CreateFlashcardCommand } from "../../../types";
import { FlashcardsService, FlashcardError } from "../../../lib/services/flashcards.service";
import { FlashcardGeneratorService } from "../../../lib/services/flashcard-generator.service";
import { OpenRouterService } from "../../../lib/services/openrouter.service";

// Validation schema for request body
const createFlashcardSchema = z.object({
  front: z
    .string()
    .trim()
    .min(1, "Front text cannot be empty or contain only whitespace")
    .max(200, "Front text cannot exceed 200 characters"),
  back: z
    .string()
    .trim()
    .min(1, "Back text cannot be empty or contain only whitespace")
    .max(500, "Back text cannot exceed 500 characters"),
});

export const prerender = false;

// Required for Astro to recognize the endpoint
export async function GET() {
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: {
      "Content-Type": "application/json",
      Allow: "POST",
    },
  });
}

export async function POST({ request, locals }: APIContext) {
  try {
    // 1. Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON format in request body",
          details: [
            {
              code: "invalid_json",
              message: "The request body is not a valid JSON",
            },
          ],
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const validationResult = createFlashcardSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid input",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command = validationResult.data as CreateFlashcardCommand;

    // 2. Create flashcard using service
    const openRouter = new OpenRouterService();
    const generator = new FlashcardGeneratorService(openRouter, locals.supabase);
    const flashcardsService = new FlashcardsService(locals.supabase, generator);
    const flashcard = await flashcardsService.createFlashcard(command);

    // 3. Return created flashcard
    return new Response(JSON.stringify(flashcard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error in POST /api/flashcards:", error);

    if (error instanceof FlashcardError) {
      const status = error.code === "VALIDATION" ? 400 : 500;
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
        }),
        {
          status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        code: "UNKNOWN",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
