import type { APIRoute } from "astro";
import { FlashcardError } from "../../../lib/services/flashcards.service";
import { initializeServices } from "../../../lib/services";
import { Logger } from "../../../lib/logger";

const logger = new Logger("API");

interface Locals {
  user: { id: string } | null;
  [key: string]: unknown;
}

const validateUser = (locals: Locals) => {
  const user = locals.user;
  if (!user) {
    throw new Error("User not authenticated");
  }
  logger.debug("User validated", { userId: user.id });
  return user;
};

const validateId = (id: string | undefined) => {
  logger.debug("Validating ID", { id });

  if (!id) {
    logger.debug("Missing ID");
    throw new Error("Missing flashcard ID");
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    logger.debug("Invalid UUID format", { id });
    throw new Error("Invalid UUID format");
  }

  return id;
};

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    logger.debug("GET request", { params, hasUser: !!locals.user, path: params.id });

    const user = validateUser(locals);
    const id = validateId(params.id);

    const flashcardsService = initializeServices(locals);
    const flashcard = await flashcardsService.getFlashcardById(user.id, id);

    return new Response(JSON.stringify(flashcard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    logger.debug("Error in GET", { error });

    if (error instanceof Error) {
      if (error.message === "Missing flashcard ID" || error.message === "Invalid UUID format") {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }

    if (error instanceof FlashcardError) {
      if (error.message === "Flashcard not found") {
        return new Response(JSON.stringify({ error: "Flashcard not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      if (error.message === "Access denied") {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

export const PUT: APIRoute = async ({ params, locals, request }) => {
  try {
    const user = validateUser(locals);
    const id = validateId(params.id);

    let updateCommand;
    try {
      updateCommand = await request.json();
      logger.debug("PUT request body:", { updateCommand });
    } catch (error) {
      logger.error("Failed to parse request body", { error });
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
        },
      });
    }

    const flashcardsService = initializeServices(locals);
    const updatedFlashcard = await flashcardsService.updateFlashcard(id, updateCommand, user.id);
    logger.debug("Updated flashcard:", { updatedFlashcard });

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    logger.debug("Error in PUT", { error });

    if (error instanceof Error) {
      if (error.message === "Missing flashcard ID" || error.message === "Invalid UUID format") {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }

    if (error instanceof FlashcardError) {
      if (error.message === "Flashcard not found") {
        return new Response(JSON.stringify({ error: "Flashcard not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      if (error.message === "Access denied") {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const user = validateUser(locals);
    const id = validateId(params.id);

    const flashcardsService = initializeServices(locals);
    await flashcardsService.deleteFlashcard(id, user.id);

    return new Response(null, { status: 204 });
  } catch (error) {
    logger.debug("Error in DELETE", { error });

    if (error instanceof Error) {
      if (error.message === "Missing flashcard ID" || error.message === "Invalid UUID format") {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }

    if (error instanceof FlashcardError) {
      if (error.message === "Flashcard not found") {
        return new Response(JSON.stringify({ error: "Flashcard not found" }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      if (error.message === "Access denied") {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: {
            "Content-Type": "application/json",
          },
        });
      }
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
