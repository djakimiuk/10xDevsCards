import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { supabaseAdmin } from "../../../../db/supabase.service";
import { logger } from "../../../../lib/logger";

export const prerender = false;

export const POST: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return new Response(JSON.stringify({ error: "Invalid ID format - must be UUID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = locals.supabase;

    logger.info("Accepting AI candidate", { id });

    // Get the candidate flashcard - use admin client for reading
    const { data: candidate, error: fetchError } = await supabaseAdmin
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

    if (fetchError || !candidate) {
      logger.error("Error fetching candidate:", { error: fetchError });
      return new Response(
        JSON.stringify({
          error: "AI candidate flashcard not found",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the current user ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id || DEFAULT_USER_ID;

    // Insert into flashcards table using admin client
    const { data: newFlashcard, error: insertError } = await supabaseAdmin
      .from("flashcards")
      .insert({
        front: candidate.front,
        back: candidate.back,
        source: "AI",
        user_id: userId,
      })
      .select(
        `
        id,
        front,
        back,
        source,
        user_id,
        created_at,
        updated_at
      `
      )
      .single();

    if (insertError) {
      logger.error("Error inserting flashcard:", { error: insertError });
      return new Response(
        JSON.stringify({
          error: "Failed to create flashcard",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Delete from ai_candidate_flashcards using admin client
    const { error: deleteError } = await supabaseAdmin.from("ai_candidate_flashcards").delete().eq("id", id);

    if (deleteError) {
      logger.error("Error deleting candidate:", { error: deleteError });
      // Note: At this point the flashcard was created but the candidate wasn't deleted
      // In a real production system, we'd want to handle this case more gracefully
      return new Response(
        JSON.stringify({
          error: "Failed to delete candidate after acceptance",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        message: "Flashcard accepted successfully",
        flashcard: newFlashcard,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    logger.error("Error in POST /api/ai-candidates/[id]/accept", { error });
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
