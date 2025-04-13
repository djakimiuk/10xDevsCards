import { z } from "zod";
import type { APIRoute } from "astro";
import type { CreateGenerationRequestCommand, GenerationRequestDTO } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

// Prevent static generation of API route
export const prerender = false;

// Validation schema for request body
const createGenerationRequestSchema = z.object({
  source_text: z
    .string()
    .min(1000, "Text must be at least 1000 characters long")
    .max(10000, "Text cannot exceed 10000 characters"),
});

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { supabase } = locals;

    // Parse and validate request body
    const body = await request.json();
    const validationResult = createGenerationRequestSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request data",
          details: validationResult.error.errors,
        }),
        { status: 400 }
      );
    }

    const command = validationResult.data as CreateGenerationRequestCommand;

    // Create generation request record
    const { data: generationRequest, error } = await supabase
      .from("generation_requests")
      .insert({
        user_id: DEFAULT_USER_ID,
        source_text: command.source_text,
        status: "processing",
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(generationRequest as GenerationRequestDTO), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing generation request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500 });
  }
};
