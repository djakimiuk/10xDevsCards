import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, PUT, DELETE } from "../[id]";
import { FlashcardsService } from "@/lib/services/flashcards.service";
import type { User } from "@supabase/supabase-js";
import { Logger } from "@/lib/logger";
import type { APIContext } from "astro";

const logger = new Logger("TEST");

// Mock FlashcardsService
vi.mock("@/lib/services/flashcards.service", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/services/flashcards.service")>();
  const FlashcardsService = vi.fn();
  FlashcardsService.prototype.getFlashcardById = vi.fn();
  FlashcardsService.prototype.updateFlashcard = vi.fn();
  FlashcardsService.prototype.deleteFlashcard = vi.fn();
  return {
    FlashcardsService,
    FlashcardError: mod.FlashcardError,
  };
});

// Helper function to create error with code
const createError = async (message: string, code: "VALIDATION" | "DATABASE" | "GENERATION" | "UNKNOWN") => {
  const { FlashcardError } = await import("@/lib/services/flashcards.service");
  return new FlashcardError(message, null, code);
};

// Minimal mock of APIContext for testing
interface MockLocals {
  user: User;
  supabase: Record<string, unknown>;
  session: null; // Adding required session property
}

interface MockAPIContext {
  params: Record<string, string | undefined>;
  locals: MockLocals;
  request?: Request;
  site?: URL;
  generator?: string;
  url?: URL;
  props?: Record<string, unknown>;
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

  const mockContext: MockAPIContext = {
    params: { id: mockFlashcardId },
    locals: {
      user: { id: mockUserId } as User,
      supabase: {},
      session: null,
    },
    site: new URL("http://localhost:3000"),
    generator: "test",
    url: new URL("http://localhost:3000"),
    props: {},
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

    // Mock the FlashcardsService methods
    (FlashcardsService.prototype.getFlashcardById as ReturnType<typeof vi.fn>).mockImplementation(
      mockService.getFlashcardById
    );
    (FlashcardsService.prototype.updateFlashcard as ReturnType<typeof vi.fn>).mockImplementation(
      mockService.updateFlashcard
    );
    (FlashcardsService.prototype.deleteFlashcard as ReturnType<typeof vi.fn>).mockImplementation(
      mockService.deleteFlashcard
    );
  });

  describe("GET /api/flashcards/[id]", () => {
    it("should return 200 and flashcard when found", async () => {
      mockService.getFlashcardById.mockResolvedValue(mockFlashcard);

      const response = await GET(mockContext as unknown as APIContext);

      const data = await response.json();
      expect(response.status).toBe(200);
      expect(data).toEqual(mockFlashcard);
    });

    it("should return 404 when flashcard not found", async () => {
      const error = await createError("Flashcard not found", "DATABASE");
      mockService.getFlashcardById.mockRejectedValue(error);

      const response = await GET(mockContext as unknown as APIContext);

      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data.error).toBe("Flashcard not found");
    });

    it("should return 400 when ID is not a valid UUID", async () => {
      const response = await GET({
        ...mockContext,
        params: { id: "not-a-uuid" },
      } as unknown as APIContext);

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should return 400 when ID is missing", async () => {
      const response = await GET({
        ...mockContext,
        params: {},
      } as unknown as APIContext);

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBe("Missing flashcard ID");
    });
  });

  describe("PUT /api/flashcards/[id]", () => {
    it("should update a flashcard", async () => {
      const updatedFlashcard = {
        id: mockFlashcardId,
        front: "Updated Front",
        back: "Updated Back",
        source: "MANUAL" as const,
        created_at: "2024-01-01T00:00:00Z",
      };

      mockService.updateFlashcard.mockResolvedValue(updatedFlashcard);

      const response = await PUT({
        params: { id: mockFlashcardId },
        locals: { user: { id: "user123" }, supabase: {}, session: null },
        request: new Request("http://localhost:3000/api/flashcards/" + mockFlashcardId, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            front: "Updated Front",
            back: "Updated Back",
          }),
        }),
      } as unknown as APIContext);

      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual(updatedFlashcard);
      expect(mockService.updateFlashcard).toHaveBeenCalledWith(
        mockFlashcardId,
        {
          front: "Updated Front",
          back: "Updated Back",
        },
        "user123"
      );
    });

    it("should return 400 when request body is invalid JSON", async () => {
      const response = await PUT({
        ...mockContext,
        request: new Request("http://localhost", {
          method: "PUT",
          body: "invalid-json",
        }),
      } as unknown as APIContext);

      const data = await response.json();
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });

  describe("DELETE /api/flashcards/[id]", () => {
    it("should delete a flashcard", async () => {
      mockService.deleteFlashcard.mockResolvedValue(undefined);

      const context = {
        ...mockContext,
        params: { id: mockFlashcardId },
        request: new Request("http://localhost/api/flashcards/" + mockFlashcardId, {
          method: "DELETE",
        }),
      } as unknown as APIContext;

      const response = await DELETE(context);
      expect(response.status).toBe(204);
    });

    it("should return 404 when deleting non-existent flashcard", async () => {
      const error = await createError("Flashcard not found", "DATABASE");
      mockService.deleteFlashcard.mockRejectedValue(error);

      const response = await DELETE(mockContext as unknown as APIContext);

      const data = await response.json();
      expect(response.status).toBe(404);
      expect(data.error).toBe("Flashcard not found");
    });

    it("should return 403 when user tries to delete another user's flashcard", async () => {
      const error = await createError("Access denied", "VALIDATION");
      mockService.deleteFlashcard.mockRejectedValue(error);

      const response = await DELETE(mockContext as unknown as APIContext);

      const data = await response.json();
      expect(response.status).toBe(403);
      expect(data.error).toBe("Access denied");
    });
  });
});
