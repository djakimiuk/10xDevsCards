import { z } from "zod";
import type { APIRoute } from "astro";
import type { GetAICandidatesResponseDTO } from "../../../types";
import { logger } from "../../../lib/logger";

// Schema for query parameters
const querySchema = z.object({
  generationRequestId: z.string().uuid("Generation request ID must be a valid UUID").optional(),
});

export const prerender = false;

export const GET: APIRoute = async ({ url, locals }) => {
  try {
    logger.info("Creating AI candidate");
    // Parse and validate query parameters
    const searchParams = Object.fromEntries(url.searchParams);
    const queryResult = querySchema.safeParse(searchParams);

    if (!queryResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: queryResult.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { generationRequestId } = queryResult.data;

    // Get supabase client from context
    const supabase = locals.supabase;

    // Build query
    let query = supabase.from("ai_candidate_flashcards").select(`
        id,
        request_id,
        front,
        back,
        created_at
      `);

    // Add filter if generationRequestId is provided
    if (generationRequestId) {
      query = query.eq("request_id", generationRequestId);
    }

    // Execute query
    const { data: aiCandidates, error } = await query;

    if (error) {
      // eslint-disable-next-line no-console
      console.error("Database error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Prepare response
    const response: GetAICandidatesResponseDTO = {
      aiCandidates: aiCandidates || [],
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    logger.error("Error creating AI candidate", { error });
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
