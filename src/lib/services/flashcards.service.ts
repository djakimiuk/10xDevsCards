import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateFlashcardCommand, FlashcardDTO } from "../../types";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export class FlashcardError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly code: "VALIDATION" | "DATABASE" | "UNKNOWN" = "UNKNOWN"
  ) {
    super(message);
    this.name = "FlashcardError";
  }
}

export class FlashcardsService {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async createFlashcard(command: CreateFlashcardCommand): Promise<FlashcardDTO> {
    try {
      console.log("Creating flashcard with data:", {
        front: command.front,
        back: command.back,
        source: "MANUAL",
        user_id: DEFAULT_USER_ID,
      });

      const { data: flashcard, error } = await this.supabase
        .from("flashcards")
        .insert({
          front: command.front,
          back: command.back,
          source: "MANUAL",
          user_id: DEFAULT_USER_ID,
        })
        .select()
        .single();

      if (error) {
        console.error("Supabase error details:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        throw new FlashcardError("Failed to create flashcard in database", error, "DATABASE");
      }

      if (!flashcard) {
        throw new FlashcardError("Flashcard was not created - no data returned", null, "DATABASE");
      }

      console.log("Successfully created flashcard:", flashcard);

      return {
        id: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
        source: "MANUAL",
        created_at: flashcard.created_at,
      };
    } catch (error) {
      if (error instanceof FlashcardError) {
        throw error;
      }
      console.error("Unexpected error details:", error);
      throw new FlashcardError("Unexpected error while creating flashcard", error);
    }
  }
}
