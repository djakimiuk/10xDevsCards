import type { APIRoute } from "astro";
import { FlashcardsService } from "../../../lib/services/flashcards.service";
import { createFlashcardSchema, flashcardQuerySchema } from "../../../lib/schemas/flashcard.schema";
import { ZodError } from "zod";
import { FlashcardGeneratorService } from "../../../lib/services/flashcard-generator.service";
import { FlashcardError } from "../../../lib/services/flashcards.service";
import { OpenRouterService } from "../../../lib/services/openrouter.service";
import type { User } from "@supabase/supabase-js";
import { Logger } from "../../../lib/logger";

const logger = new Logger("API");

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams);
    const { page, limit, source } = flashcardQuerySchema.parse(params);

    const openRouter = new OpenRouterService();
    const generator = new FlashcardGeneratorService(openRouter, locals.supabase);
    const flashcardsService = new FlashcardsService(locals.supabase, generator);
    const user = locals.user as User | null;

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const result = await flashcardsService.getFlashcards(user.id, page, limit, source);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({ error: "Invalid query parameters", details: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof FlashcardError) {
      const status = error.code === "DATABASE" ? 500 : 400;
      return new Response(JSON.stringify({ error: error.message }), {
        status,
        headers: { "Content-Type": "application/json" },
      });
    }

    logger.error("Error in GET /api/flashcards:", { error });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    let body;
    try {
      body = await request.json();
    } catch (error) {
      logger.error("Error parsing request body:", { error });
      return new Response(JSON.stringify({ error: "Invalid JSON in request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const command = createFlashcardSchema.parse(body);

    const openRouter = new OpenRouterService();
    const generator = new FlashcardGeneratorService(openRouter, locals.supabase);
    const flashcardsService = new FlashcardsService(locals.supabase, generator);
    const user = locals.user as User | null;

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const flashcard = await flashcardsService.createFlashcard(command, user.id);

    return new Response(JSON.stringify(flashcard), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (error instanceof FlashcardError) {
      if (error.code === "DATABASE") {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
