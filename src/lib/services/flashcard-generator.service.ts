import { logger } from "../logger";
import { OpenRouterService } from "./openrouter.service";
import type { FlashcardCandidate } from "./openrouter.types";
import { GenerateFlashcardsResponseSchema } from "./openrouter.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../db/database.types";
import { supabaseAdmin } from "../../db/supabase.service";

export class FlashcardGeneratorService {
  private readonly _logPrefix: string = "FlashcardGenerator";
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
  ) {}

  async generateFlashcards(text: string): Promise<FlashcardCandidate[]> {
    logger.info(`${this._logPrefix}: Generating flashcards from text`, {
      textLength: text.length,
    });

    let requestId: string | null = null;

    try {
      // Get current user ID
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();

      if (userError) {
        logger.error(`${this._logPrefix}: Failed to get current user`, { error: userError });
        throw new Error("Authentication error: " + userError.message);
      }

      if (!user) {
        logger.error(`${this._logPrefix}: No authenticated user found`);
        throw new Error("Authentication error: No user found");
      }

      const userId = user.id;
      logger.info(`${this._logPrefix}: Using user ID for flashcard generation`, { userId });

      // Create generation request
      const { data: request, error: requestError } = await this.supabase
        .from("generation_requests")
        .insert({
          user_id: userId,
          source_text: text,
          status: "processing",
        })
        .select()
        .single();

      if (requestError) {
        logger.error(`${this._logPrefix}: Failed to create generation request`, { error: requestError });
        throw new Error("Failed to create generation request: " + requestError.message);
      }

      requestId = request.id;
      logger.info(`${this._logPrefix}: Created generation request`, { requestId });

      // Override system message for flashcard generation
      const originalSystemMessage = this.openRouter.systemMessage;
      this.openRouter.systemMessage = this._systemPrompt;

      try {
        logger.info(`${this._logPrefix}: Sending request to OpenRouter`, { textLength: text.length });
        const response = await this.openRouter.sendMessage(
          `Please analyze this text and generate flashcard candidates:\n\n${text}`
        );

        // Validate response format
        logger.debug(`${this._logPrefix}: Validating OpenRouter response`);
        const parsedResponse = GenerateFlashcardsResponseSchema.parse(response);

        if (!parsedResponse.flashcards || parsedResponse.flashcards.length === 0) {
          logger.warn(`${this._logPrefix}: No flashcards generated`, { response });
          await this.supabase.from("generation_requests").update({ status: "failed" }).eq("id", requestId);
          return [];
        }

        logger.info(`${this._logPrefix}: Received flashcards from OpenRouter`, {
          count: parsedResponse.flashcards.length,
        });

        // Validate each flashcard
        const validFlashcards = parsedResponse.flashcards.filter((card) => {
          const isValid = card.front?.trim() && card.back?.trim();
          if (!isValid) {
            logger.warn(`${this._logPrefix}: Invalid flashcard found`, { card });
          }
          return isValid;
        });

        if (validFlashcards.length === 0) {
          logger.warn(`${this._logPrefix}: No valid flashcards after filtering`, {
            total: parsedResponse.flashcards.length,
          });
          await this.supabase.from("generation_requests").update({ status: "failed" }).eq("id", requestId);
          return [];
        }

        logger.info(`${this._logPrefix}: Storing valid flashcards`, { count: validFlashcards.length });

        // Store candidates in the database using admin client to bypass RLS
        const { data: storedCandidates, error: candidatesError } = await supabaseAdmin
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
          logger.error(`${this._logPrefix}: Failed to store flashcard candidates`, { error: candidatesError });
          await this.supabase.from("generation_requests").update({ status: "failed" }).eq("id", requestId);
          throw new Error("Failed to store flashcard candidates: " + candidatesError.message);
        }

        // Update request status
        await this.supabase.from("generation_requests").update({ status: "completed" }).eq("id", requestId);

        logger.info(`${this._logPrefix}: Successfully generated flashcards`, {
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
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        logger.error(`${this._logPrefix}: Failed to generate or store flashcards`, { requestId, errorMessage });
        if (requestId) {
          await this.supabase.from("generation_requests").update({ status: "failed" }).eq("id", requestId);
        }
        throw error;
      } finally {
        // Restore original system message
        this.openRouter.systemMessage = originalSystemMessage;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error(`${this._logPrefix}: Flashcard generation failed`, {
        textLength: text.length,
        requestId,
        errorMessage,
      });
      throw error;
    }
  }
}
