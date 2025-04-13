import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateFlashcardCommand, FlashcardDTO } from "../../types";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { FlashcardGeneratorService } from "./flashcard-generator.service";
import { Logger } from "../logger";

export class FlashcardError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly code: "VALIDATION" | "DATABASE" | "GENERATION" | "UNKNOWN" = "UNKNOWN"
  ) {
    super(message);
    this.name = "FlashcardError";
  }
}

export class FlashcardsService {
  private readonly _logger: Logger;

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly generator: FlashcardGeneratorService
  ) {
    this._logger = new Logger("FlashcardsService");
  }

  async createFlashcard(command: CreateFlashcardCommand): Promise<FlashcardDTO> {
    try {
      this._logger.info("Creating flashcard", {
        front: command.front,
        back: command.back,
        source: "MANUAL",
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
        this._logger.error(
          "Database error while creating flashcard",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          },
          error
        );

        throw new FlashcardError("Failed to create flashcard in database", error, "DATABASE");
      }

      if (!flashcard) {
        throw new FlashcardError("Flashcard was not created - no data returned", null, "DATABASE");
      }

      this._logger.info("Successfully created flashcard", { id: flashcard.id });

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
      this._logger.error("Unexpected error while creating flashcard", {}, error as Error);
      throw new FlashcardError("Unexpected error while creating flashcard", error);
    }
  }

  async generateFlashcardsFromText(text: string): Promise<FlashcardDTO[]> {
    try {
      this._logger.info("Generating flashcards from text", {
        textLength: text.length,
      });

      const candidates = await this.generator.generateFlashcards(text);

      // Filter out low confidence candidates
      const highConfidenceCandidates = candidates.filter((c) => c.confidence >= 0.7);

      this._logger.info("Creating generated flashcards", {
        totalCandidates: candidates.length,
        highConfidenceCandidates: highConfidenceCandidates.length,
      });

      // Create flashcards for high confidence candidates
      const createdFlashcards = await Promise.all(
        highConfidenceCandidates.map((candidate) =>
          this.createFlashcard({
            front: candidate.front,
            back: candidate.back,
          })
        )
      );

      return createdFlashcards;
    } catch (error) {
      this._logger.error("Failed to generate flashcards from text", { textLength: text.length }, error as Error);
      throw new FlashcardError("Failed to generate flashcards from text", error, "GENERATION");
    }
  }
}
