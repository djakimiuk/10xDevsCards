import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";

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

    // Get the candidate flashcard
    const { data: candidate, error: fetchError } = await supabase
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

    // Insert into flashcards table
    const { data: newFlashcard, error: insertError } = await supabase
      .from("flashcards")
      .insert({
        front: candidate.front,
        back: candidate.back,
        source: "AI",
        user_id: DEFAULT_USER_ID,
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
      console.error("Error inserting flashcard:", insertError);
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

    // Delete from ai_candidate_flashcards
    const { error: deleteError } = await supabase.from("ai_candidate_flashcards").delete().eq("id", id);

    if (deleteError) {
      console.error("Error deleting candidate:", deleteError);
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
    console.error("Unexpected error:", error);
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
