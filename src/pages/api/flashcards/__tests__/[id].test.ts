import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "../[id]";
import { FlashcardsService } from "../../../../lib/services/flashcards.service";
import type { User } from "@supabase/supabase-js";
import { Logger } from "../../../../lib/logger";
import type { APIContext } from "astro";

const logger = new Logger("TEST");

// Import the actual module to get the real FlashcardError class
const { FlashcardError } = await vi.importActual<typeof import("../../../../lib/services/flashcards.service")>(
  "../../../../lib/services/flashcards.service"
);

// Helper function to create properly mocked FlashcardError
const createFlashcardError = (message: string, code: "VALIDATION" | "DATABASE" | "GENERATION" | "UNKNOWN") => {
  return new FlashcardError(message, null, code);
};

interface MockContext {
  params: { id?: string };
  locals: {
    user: User;
    supabase: Record<string, unknown>;
  };
  request?: Request;
}

describe("Flashcard [id] endpoints", () => {
  const mockUserId = "test-user-id";
  const mockFlashcardId = "123e4567-e89b-42d3-a456-426614174000";
  const mockFlashcard = {
    id: mockFlashcardId,
    front: "Test front",
    back: "Test back",
    source: "MANUAL" as const,
    created_at: new Date().toISOString(),
  };

  const updateCommand = {
    front: "Updated front",
    back: "Updated back",
  };

  const mockContext: MockContext = {
    params: { id: mockFlashcardId },
    locals: {
      user: { id: mockUserId } as User,
      supabase: {},
    },
  };

  let mockService: {
    getFlashcardById: ReturnType<typeof vi.fn>;
    updateFlashcard: ReturnType<typeof vi.fn>;
    deleteFlashcard: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.resetAllMocks();
    logger.debug("[TEST SETUP] Initializing test with mock data:", {
      mockUserId,
      mockFlashcardId,
      isValidUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(mockFlashcardId),
    });

    // Create mock service instance
    mockService = {
      getFlashcardById: vi.fn(),
      updateFlashcard: vi.fn(),
      deleteFlashcard: vi.fn(),
    };

    // Mock the FlashcardsService constructor
    vi.spyOn(FlashcardsService.prototype, "getFlashcardById").mockImplementation(mockService.getFlashcardById);
    vi.spyOn(FlashcardsService.prototype, "updateFlashcard").mockImplementation(mockService.updateFlashcard);
    vi.spyOn(FlashcardsService.prototype, "deleteFlashcard").mockImplementation(mockService.deleteFlashcard);
  });

  vi.mock("../../../../lib/services/flashcard-generator.service");

  describe("GET /api/flashcards/[id]", () => {
    it("should return 200 and flashcard when found", async () => {
      // Mock the service
      mockService.getFlashcardById.mockResolvedValue(mockFlashcard);

      const response = await GET({
        ...mockContext,
      } as APIContext);

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual(mockFlashcard);
    });

    it("should return 404 when flashcard not found", async () => {
      // Mock the service to throw FlashcardError
      mockService.getFlashcardById.mockRejectedValue(createFlashcardError("Flashcard not found", "DATABASE"));

      const response = await GET({
        ...mockContext,
      } as APIContext);

      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data.error).toBe("Flashcard not found");
    });

    it("should return 400 when ID is not a valid UUID", async () => {
      const response = await GET({
        params: { id: "not-a-uuid" },
        locals: mockContext.locals,
      } as APIContext);

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 400 when ID is missing", async () => {
      const response = await GET({
        params: {},
        locals: mockContext.locals,
      } as APIContext);

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing flashcard ID");
    });
  });

  describe("PUT /api/flashcards/[id]", () => {
    it("should return 200 and updated flashcard when successful", async () => {
      const updatedFlashcard = { ...mockFlashcard, ...updateCommand };
      mockService.updateFlashcard.mockResolvedValue(updatedFlashcard);

      const response = await PUT({
        ...mockContext,
        request: new Request("http://localhost", {
          method: "PUT",
          body: JSON.stringify(updateCommand),
        }),
      } as APIContext);

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual(updatedFlashcard);
    });

    it("should return 400 when request body is invalid JSON", async () => {
      const response = await PUT({
        ...mockContext,
        request: new Request("http://localhost", {
          method: "PUT",
          body: "invalid-json",
        }),
      } as APIContext);

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe("DELETE /api/flashcards/[id]", () => {
    it("should return 204 when deletion is successful", async () => {
      mockService.deleteFlashcard.mockResolvedValue(undefined);

      const response = await DELETE(mockContext as APIContext);

      expect(response.status).toBe(204);
    });

    it("should return 404 when deleting non-existent flashcard", async () => {
      mockService.deleteFlashcard.mockRejectedValue(createFlashcardError("Flashcard not found", "DATABASE"));

      const response = await DELETE(mockContext as APIContext);

      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data.error).toBe("Flashcard not found");
    });

    it("should return 403 when user tries to delete another user's flashcard", async () => {
      mockService.deleteFlashcard.mockRejectedValue(createFlashcardError("Access denied", "VALIDATION"));

      const response = await DELETE(mockContext as APIContext);

      const data = await response.json();
      expect(response.status).toBe(403);
      expect(data.error).toBe("Access denied");
    });
  });
});
