import { z } from "zod";

// Base schemas for validation
export const MessageSchema = z.object({
  role: z.enum(["system", "user", "assistant"]),
  content: z.string(),
});

export const ModelParamsSchema = z.object({
  model: z.string(),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional(),
  top_p: z.number().min(0).max(1).optional(),
  frequency_penalty: z.number().min(-2).max(2).optional(),
  presence_penalty: z.number().min(-2).max(2).optional(),
});

export const ResponseFormatSchema = z.union([
  z.object({
    type: z.literal("json_schema"),
    json_schema: z.object({
      name: z.string(),
      strict: z.boolean(),
      schema: z.record(z.string()),
    }),
  }),
  z.object({
    type: z.literal("json_object"),
  }),
]);

// Flashcard generation schemas
export const FlashcardCandidateSchema = z.object({
  id: z.string().uuid().optional(),
  requestId: z.string().uuid().optional(),
  front: z.string(),
  back: z.string(),
  confidence: z.number().min(0).max(1),
  explanation: z.string(),
  createdAt: z.string().datetime().optional(),
});

export const ChatCompletionResponseSchema = z.object({
  flashcards: z.array(FlashcardCandidateSchema),
  reference: z.string(),
});

export const GenerateFlashcardsResponseSchema = ChatCompletionResponseSchema;

// Types derived from schemas
export type Message = z.infer<typeof MessageSchema>;
export type ModelParams = z.infer<typeof ModelParamsSchema>;
export type ResponseFormat = z.infer<typeof ResponseFormatSchema>;
export type ResponseType = GenerateFlashcardsResponse;
export type FlashcardCandidate = z.infer<typeof FlashcardCandidateSchema>;
export type GenerateFlashcardsResponse = z.infer<typeof GenerateFlashcardsResponseSchema>;

// Custom error classes
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "APIError";
  }
}
