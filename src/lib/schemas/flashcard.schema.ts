import { z } from "zod";
import { Logger } from "../logger";

const logger = new Logger("Schema");

export const createFlashcardSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
});

export const updateFlashcardSchema = createFlashcardSchema;

export const flashcardQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  source: z.enum(["AI", "MANUAL"]).optional(),
});

// Add debug logging to UUID validation
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const flashcardIdSchema = z.object({
  id: z.string().refine((val) => {
    logger.debug("[Schema Validation] Validating UUID:", {
      value: val,
      matches: uuidRegex.test(val),
      pattern: uuidRegex.source,
    });
    return uuidRegex.test(val);
  }, "Invalid uuid"),
});
