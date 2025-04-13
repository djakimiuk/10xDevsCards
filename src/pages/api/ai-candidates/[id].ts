import { z } from "zod";
import type { APIRoute } from "astro";
import type { UpdateAICandidateFlashcardCommand } from "../../../types";

// Schema for request body validation
const updateSchema = z.object({
  front: z.string().max(200, "Front text cannot exceed 200 characters"),
  back: z.string().max(500, "Back text cannot exceed 500 characters"),
});

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
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
      console.error("Database error:", error);
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
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
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

    // Get supabase client from context
    const supabase = locals.supabase;

    // Update flashcard
    const { data: updatedFlashcard, error } = await supabase
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

    if (error) {
      console.error("Database error:", error);
      if (error.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Flashcard not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(updatedFlashcard), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;
    if (!id || !/^[0-9a-fA-F-]{36}$/.test(id)) {
      return new Response(JSON.stringify({ error: "Invalid flashcard ID format - must be UUID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = locals.supabase;

    const { error } = await supabase.from("ai_candidate_flashcards").delete().eq("id", id);

    if (error) {
      console.error("Database error:", error);
      if (error.code === "PGRST116") {
        return new Response(JSON.stringify({ error: "Flashcard not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(null, {
      status: 204,
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
