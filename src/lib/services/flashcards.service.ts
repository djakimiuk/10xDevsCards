import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import type { CreateFlashcardCommand, FlashcardDTO, UpdateFlashcardCommand } from "../../types";
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

  async getFlashcards(userId: string = DEFAULT_USER_ID, page = 1, limit = 10, source?: "AI" | "MANUAL") {
    try {
      this._logger.info("Fetching flashcards", { userId, page, limit, source });

      const offset = (page - 1) * limit;
      let query = this.supabase
        .from("flashcards")
        .select("*", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (source) {
        query = query.eq("source", source);
      }

      const { data, error, count } = await query;

      if (error) {
        this._logger.error(
          "Database error while fetching flashcards",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          },
          error
        );
        throw new FlashcardError("Failed to fetch flashcards from database", error, "DATABASE");
      }

      return {
        flashcards: data as FlashcardDTO[],
        pagination: {
          page,
          limit,
          total: count ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof FlashcardError) {
        throw error;
      }
      this._logger.error("Unexpected error while fetching flashcards", {}, error as Error);
      throw new FlashcardError("Unexpected error while fetching flashcards", error);
    }
  }

  async getFlashcardById(userId: string = DEFAULT_USER_ID, id: string) {
    try {
      this._logger.info("Fetching flashcard by ID", { userId, id });

      const { data, error } = await this.supabase.from("flashcards").select("*").eq("id", id).single();

      if (error) {
        if (error.code === "PGRST116") {
          throw new FlashcardError("Flashcard not found", error, "DATABASE");
        }
        this._logger.error(
          "Database error while fetching flashcard",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          },
          error
        );
        throw new FlashcardError("Failed to fetch flashcard from database", error, "DATABASE");
      }

      // Check if the flashcard belongs to the user
      if (data.user_id !== userId) {
        throw new FlashcardError("Access denied", null, "VALIDATION");
      }

      return data as FlashcardDTO;
    } catch (error) {
      if (error instanceof FlashcardError) {
        throw error;
      }
      this._logger.error("Unexpected error while fetching flashcard", {}, error as Error);
      throw new FlashcardError("Unexpected error while fetching flashcard", error);
    }
  }

  async createFlashcard(command: CreateFlashcardCommand, userId: string = DEFAULT_USER_ID): Promise<FlashcardDTO> {
    try {
      this._logger.info("Creating flashcard", {
        front: command.front,
        back: command.back,
        source: "MANUAL",
        userId,
      });

      const { data: flashcard, error } = await this.supabase
        .from("flashcards")
        .insert({
          front: command.front,
          back: command.back,
          source: "MANUAL",
          user_id: userId,
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

  async updateFlashcard(id: string, data: UpdateFlashcardCommand, userId: string): Promise<FlashcardDTO> {
    this._logger.debug("Updating flashcard", { id, data, userId });

    const { data: flashcard, error } = await this.supabase
      .from("flashcards")
      .update({
        front: data.front,
        back: data.back,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    this._logger.debug("Update response:", { flashcard, error });

    if (error) {
      this._logger.error("Error updating flashcard:", { error });
      if (error.code === "PGRST116") {
        throw new FlashcardError("Flashcard not found", error, "DATABASE");
      }
      throw new FlashcardError("Failed to update flashcard", error, "DATABASE");
    }

    if (!flashcard) {
      throw new FlashcardError("Failed to update flashcard", null, "DATABASE");
    }

    // Konwertuj dane z bazy na FlashcardDTO
    return {
      id: flashcard.id,
      front: flashcard.front,
      back: flashcard.back,
      source: flashcard.source as "AI" | "MANUAL",
      created_at: flashcard.created_at,
    };
  }

  async deleteFlashcard(id: string, userId: string = DEFAULT_USER_ID) {
    try {
      this._logger.info("Deleting flashcard", { id, userId });

      // First check if the flashcard exists and belongs to the user
      const { data: existingCard, error: checkError } = await this.supabase
        .from("flashcards")
        .select("id")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (checkError) {
        this._logger.debug("Database check error", {
          error: checkError,
          code: checkError.code,
          message: checkError.message,
        });

        if (checkError.code === "PGRST116") {
          const error = new FlashcardError("Flashcard not found", checkError, "DATABASE");
          this._logger.debug("Created FlashcardError for not found", {
            error,
            name: error.name,
            message: error.message,
            code: error.code,
          });
          throw error;
        }
        throw new FlashcardError("Failed to check flashcard access", checkError, "DATABASE");
      }

      if (!existingCard) {
        const error = new FlashcardError("Access denied", null, "VALIDATION");
        this._logger.debug("Created FlashcardError for access denied", {
          error,
          name: error.name,
          message: error.message,
          code: error.code,
        });
        throw error;
      }

      const { error } = await this.supabase.from("flashcards").delete().eq("user_id", userId).eq("id", id);

      if (error) {
        this._logger.debug("Database delete error", {
          error,
          code: error.code,
          message: error.message,
        });

        if (error.code === "PGRST116") {
          const notFoundError = new FlashcardError("Flashcard not found", error, "DATABASE");
          this._logger.debug("Created FlashcardError for not found during delete", {
            error: notFoundError,
            name: notFoundError.name,
            message: notFoundError.message,
            code: notFoundError.code,
          });
          throw notFoundError;
        }
        this._logger.error(
          "Database error while deleting flashcard",
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          },
          error
        );
        throw new FlashcardError("Failed to delete flashcard from database", error, "DATABASE");
      }
    } catch (error) {
      if (error instanceof FlashcardError) {
        this._logger.debug("Re-throwing FlashcardError", {
          error,
          name: error.name,
          message: error.message,
          code: error.code,
        });
        throw error;
      }
      this._logger.error("Unexpected error while deleting flashcard", {}, error as Error);
      throw new FlashcardError("Unexpected error while deleting flashcard", error);
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
