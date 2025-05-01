import { z } from "zod";
import type { APIRoute } from "astro";
import type { UpdateAICandidateFlashcardCommand } from "../../../types";
import { logger } from "../../../lib/logger";
import { supabaseAdmin } from "../../../db/supabase.service";

// Schema for request body validation
const updateSchema = z.object({
  front: z.string().max(200, "Front text cannot exceed 200 characters"),
  back: z.string().max(500, "Back text cannot exceed 500 characters"),
});

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    logger.info("Fetching AI candidate", { id: params.id });
    // Validate ID parameter
    const { id } = params;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return new Response(JSON.stringify({ error: "Invalid flashcard ID format - must be UUID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = locals.supabase;

    // Get the candidate flashcard
    const { data: candidate, error } = await supabase
      .from("ai_candidate_flashcards")
      .select(
        `
        id,
        request_id,
        front,
        back,
        created_at
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      logger.error("Database error:", { error });
      if (error.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "AI candidate flashcard not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(candidate), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Error in GET /api/ai-candidates/[id]", { error });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    logger.info("Updating AI candidate", { id: params.id });
    // Validate ID parameter
    const { id } = params;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return new Response(JSON.stringify({ error: "Invalid flashcard ID format - must be UUID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Parse and validate request body
    const body: UpdateAICandidateFlashcardCommand = await request.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: validationResult.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { front, back } = validationResult.data;

    // First verify the user has access to this card using the standard client
    const supabase = locals.supabase;
    const { data: existingCard, error: checkError } = await supabase
      .from("ai_candidate_flashcards")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingCard) {
      logger.error("Error checking access to AI candidate", { error: checkError });
      return new Response(JSON.stringify({ error: "Flashcard not found or access denied" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If access check passes, use admin client to bypass RLS for update
    const { data: updatedFlashcard, error: updateError } = await supabaseAdmin
      .from("ai_candidate_flashcards")
      .update({
        front,
        back,
      })
      .eq("id", id)
      .select(
        `
        id,
        request_id,
        front,
        back,
        created_at
      `
      )
      .single();

    if (updateError) {
      logger.error("Database error on update:", { error: updateError });
      return new Response(JSON.stringify({ error: "Failed to update flashcard" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Error updating AI candidate", { error, id: params.id });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    logger.info("Deleting AI candidate", { id: params.id });
    const { id } = params;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return new Response(JSON.stringify({ error: "Invalid flashcard ID format - must be UUID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // First verify the user has access to this card
    const supabase = locals.supabase;
    const { data: existingCard, error: checkError } = await supabase
      .from("ai_candidate_flashcards")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingCard) {
      logger.error("Error checking access to AI candidate", { error: checkError });
      return new Response(JSON.stringify({ error: "Flashcard not found or access denied" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If access check passes, use admin client for delete operation
    const { error: deleteError } = await supabaseAdmin.from("ai_candidate_flashcards").delete().eq("id", id);

    if (deleteError) {
      logger.error("Database error on delete:", { error: deleteError });
      return new Response(JSON.stringify({ error: "Failed to delete flashcard" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    logger.error("Error deleting AI candidate", { error, id: params.id });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
