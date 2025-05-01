import { Logger } from "../logger";
import { OpenRouterService } from "./openrouter.service";
import type { FlashcardCandidate } from "./openrouter.types";
import { GenerateFlashcardsResponseSchema } from "./openrouter.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export class FlashcardGeneratorService {
  private readonly _logger: Logger;
  private readonly _systemPrompt = `You are an expert educational flashcard creator. Your task is to analyze technical documentation or educational text and create effective flashcards for learning.

For each important concept, definition, or fact, create a flashcard that follows these principles:
1. Front: Create a clear, specific question that tests understanding (not just recall)
2. Back: Provide a concise but complete answer that fully addresses the question
3. Confidence (0-1): Rate how fundamental/important this concept is for understanding the topic
4. Explanation: Briefly explain why this concept is important to learn

You MUST respond with a JSON object containing:
- 'flashcards': array of flashcard objects, each containing:
  - 'front': the question or prompt (string)
  - 'back': the answer or explanation (string)
  - 'confidence': number between 0 and 1
  - 'explanation': why this makes a good flashcard (string)
- 'reference': brief summary of the analyzed text (string)

Example response format:
{
  "flashcards": [
    {
      "front": "What is the main difference between X and Y?",
      "back": "X provides feature A, while Y offers feature B.",
      "confidence": 0.9,
      "explanation": "Understanding this difference is crucial because..."
    }
  ],
  "reference": "The text explains the key differences between X and Y..."
}

Focus on creating flashcards that:
- Test understanding of core concepts
- Cover key definitions and terminology
- Highlight relationships between concepts
- Address common misconceptions
- Include practical usage examples

Keep each flashcard focused on a single concept and ensure the question-answer pair is clear and unambiguous.`;

  constructor(
    private readonly openRouter: OpenRouterService,
    private readonly supabase: SupabaseClient<Database>
  ) {
    this._logger = new Logger("FlashcardGenerator");
  }

  async generateFlashcards(text: string): Promise<FlashcardCandidate[]> {
    this._logger.info("Generating flashcards from text", {
      textLength: text.length,
    });

    let requestId: string | null = null;

    try {
      // Create generation request
      const { data: request, error: requestError } = await this.supabase
        .from("generation_requests")
        .insert({
          user_id: DEFAULT_USER_ID,
          source_text: text,
          status: "processing",
        })
        .select()
        .single();

      if (requestError) {
        this._logger.error("Failed to create generation request", { error: requestError });
        throw new Error("Failed to create generation request");
      }

      requestId = request.id;

      // Override system message for flashcard generation
      const originalSystemMessage = this.openRouter.systemMessage;
      this.openRouter.systemMessage = this._systemPrompt;

      try {
        const response = await this.openRouter.sendMessage(
          `Please analyze this text and generate flashcard candidates:\n\n${text}`
        );

        // Validate response format
        const parsedResponse = GenerateFlashcardsResponseSchema.parse(response);

        if (!parsedResponse.flashcards || parsedResponse.flashcards.length === 0) {
          this._logger.warn("No flashcards generated", { response });
          await this.supabase.from("generation_requests").update({ status: "failed" }).eq("id", requestId);
          return [];
        }

        // Validate each flashcard
        const validFlashcards = parsedResponse.flashcards.filter((card) => {
          const isValid = card.front?.trim() && card.back?.trim();
          if (!isValid) {
            this._logger.warn("Invalid flashcard found", { card });
          }
          return isValid;
        });

        if (validFlashcards.length === 0) {
          this._logger.warn("No valid flashcards after filtering", {
            total: parsedResponse.flashcards.length,
          });
          await this.supabase.from("generation_requests").update({ status: "failed" }).eq("id", requestId);
          return [];
        }

        // Store candidates in the database
        const { data: storedCandidates, error: candidatesError } = await this.supabase
          .from("ai_candidate_flashcards")
          .insert(
            validFlashcards.map((card) => ({
              request_id: requestId,
              front: card.front.trim(),
              back: card.back.trim(),
            }))
          )
          .select("id, request_id, front, back, created_at");

        if (candidatesError) {
          this._logger.error("Failed to store flashcard candidates", { error: candidatesError });
          await this.supabase.from("generation_requests").update({ status: "failed" }).eq("id", requestId);
          throw new Error("Failed to store flashcard candidates");
        }

        // Update request status
        await this.supabase.from("generation_requests").update({ status: "completed" }).eq("id", requestId);

        this._logger.info("Successfully generated flashcards", {
          total: parsedResponse.flashcards.length,
          valid: validFlashcards.length,
          requestId,
        });

        // Map stored candidates back to FlashcardCandidate type with additional database fields
        return validFlashcards.map((card, index) => ({
          ...card,
          id: storedCandidates[index].id,
          requestId: storedCandidates[index].request_id,
          createdAt: storedCandidates[index].created_at,
        }));
      } catch (error) {
        this._logger.error("Failed to generate or store flashcards", { requestId }, error as Error);
        if (requestId) {
          await this.supabase.from("generation_requests").update({ status: "failed" }).eq("id", requestId);
        }
        throw error;
      } finally {
        // Restore original system message
        this.openRouter.systemMessage = originalSystemMessage;
      }
    } catch (error) {
      this._logger.error("Flashcard generation failed", { textLength: text.length, requestId }, error as Error);
      throw error;
    }
  }
}
