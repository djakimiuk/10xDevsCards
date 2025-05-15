import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "../index";
import { FlashcardsService } from "../../../../lib/services/flashcards.service";
import { FlashcardError } from "../../../../lib/services/flashcards.service";
import type { User } from "@supabase/supabase-js";
import type { FlashcardDTO, FlashcardSource } from "../../../../types";
import type { APIContext } from "astro";

vi.mock("../../../../lib/services/flashcards.service");
vi.mock("../../../../lib/services/flashcard-generator.service");
vi.mock("../../../../lib/services/openrouter.service");

describe("Flashcards endpoints", () => {
  const mockUser: User = {
    id: "test-user-id",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "",
  };

  const mockDate = new Date("2025-05-15T21:48:44.675Z").toISOString();

  const mockFlashcards: FlashcardDTO[] = [
    {
      id: "test-flashcard-1",
      front: "Test Question 1",
      back: "Test Answer 1",
      source: "MANUAL" as FlashcardSource,
      created_at: mockDate,
    },
    {
      id: "test-flashcard-2",
      front: "Test Question 2",
      back: "Test Answer 2",
      source: "AI" as FlashcardSource,
      created_at: mockDate,
    },
  ];

  const mockContext = {
    locals: {
      user: mockUser,
      supabase: {},
    },
  };

  const createAPIContext = (request: Request, overrideContext = {}): APIContext =>
    ({
      ...mockContext,
      ...overrideContext,
      request,
      site: { site: "test" },
      generator: "test",
      url: new URL(request.url),
      params: {},
      props: {},
      redirect: () => Promise.resolve(new Response()),
      cookies: {
        get: () => undefined,
        has: () => false,
        set: () => vi.fn(),
        delete: () => vi.fn(),
        headers: () => ({}),
        merge: () => vi.fn(),
      },
      rewrite: async () => new Response(),
      preferredLocale: "en",
      preferredLocaleList: ["en"],
      currentLocale: "en",
      route: "/api/flashcards",
      routeData: { route: "/api/flashcards" },
    }) as unknown as APIContext;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/flashcards", () => {
    const mockPaginationResult = {
      flashcards: mockFlashcards,
      pagination: {
        page: 1,
        limit: 10,
        total: 2,
      },
    };

    it("should return 200 and flashcards list with pagination", async () => {
      const request = new Request("http://localhost/api/flashcards?page=1&limit=10");
      vi.mocked(FlashcardsService.prototype.getFlashcards).mockResolvedValueOnce(mockPaginationResult);

      const response = await GET(createAPIContext(request));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockPaginationResult);
    });

    it("should handle maximum pagination limit (100)", async () => {
      // Arrange
      const request = new Request("http://localhost/api/flashcards?limit=100");
      vi.mocked(FlashcardsService.prototype.getFlashcards).mockResolvedValueOnce({
        ...mockPaginationResult,
        pagination: { ...mockPaginationResult.pagination, limit: 100 },
      });

      // Act
      const response = await GET(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.pagination.limit).toBe(100);
    });

    it("should return 400 when pagination limit exceeds maximum", async () => {
      // Arrange
      const request = new Request("http://localhost/api/flashcards?limit=101");

      // Act
      const response = await GET(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid query parameters");
    });

    it("should handle source filter correctly", async () => {
      // Arrange
      const request = new Request("http://localhost/api/flashcards?source=AI");
      vi.mocked(FlashcardsService.prototype.getFlashcards).mockResolvedValueOnce({
        ...mockPaginationResult,
        flashcards: mockFlashcards.filter((f) => f.source === "AI"),
      });

      // Act
      const response = await GET(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.flashcards.every((f: FlashcardDTO) => f.source === "AI")).toBe(true);
      expect(FlashcardsService.prototype.getFlashcards).toHaveBeenCalledWith(mockUser.id, 1, 10, "AI");
    });

    it("should return 400 when source is invalid", async () => {
      // Arrange
      const request = new Request("http://localhost/api/flashcards?source=INVALID");

      // Act
      const response = await GET(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid query parameters");
    });

    it("should return 401 when user is not authenticated", async () => {
      const request = new Request("http://localhost/api/flashcards");
      const response = await GET(
        createAPIContext(request, {
          locals: { ...mockContext.locals, user: null },
        })
      );

      const data = await response.json();
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: "Unauthorized" });
    });
  });

  describe("POST /api/flashcards", () => {
    const createCommand = {
      front: "New Question",
      back: "New Answer",
    };

    it("should return 201 and created flashcard when successful", async () => {
      // Arrange
      const mockCreatedFlashcard = {
        ...createCommand,
        id: "new-flashcard-id",
        userId: mockUser.id,
        source: "MANUAL" as FlashcardSource,
        created_at: new Date().toISOString(),
      };

      vi.mocked(FlashcardsService.prototype.createFlashcard).mockResolvedValueOnce(mockCreatedFlashcard);

      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        body: JSON.stringify(createCommand),
      });

      // Act
      const response = await POST(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(201);
      expect(data).toEqual(mockCreatedFlashcard);
      expect(FlashcardsService.prototype.createFlashcard).toHaveBeenCalledWith(createCommand, mockUser.id);
    });

    it("should return 400 when front exceeds maximum length", async () => {
      // Arrange
      const invalidCommand = {
        front: "a".repeat(201), // Przekroczenie limitu 200 znaków
        back: "Valid answer",
      };

      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        body: JSON.stringify(invalidCommand),
      });

      // Act
      const response = await POST(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("should return 400 when back exceeds maximum length", async () => {
      // Arrange
      const invalidCommand = {
        front: "Valid question",
        back: "a".repeat(501), // Przekroczenie limitu 500 znaków
      };

      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        body: JSON.stringify(invalidCommand),
      });

      // Act
      const response = await POST(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("should return 400 when fields are empty", async () => {
      // Arrange
      const invalidCommand = {
        front: "",
        back: "",
      };

      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        body: JSON.stringify(invalidCommand),
      });

      // Act
      const response = await POST(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("should return 400 when required fields are missing", async () => {
      // Arrange
      const invalidCommand = {
        front: "Only front provided",
      };

      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        body: JSON.stringify(invalidCommand),
      });

      // Act
      const response = await POST(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid request body");
    });

    it("should return 400 when request body is invalid JSON", async () => {
      // Arrange
      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        body: "invalid json",
      });

      // Act
      const response = await POST(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it("should handle database errors correctly", async () => {
      // Arrange
      vi.mocked(FlashcardsService.prototype.createFlashcard).mockRejectedValueOnce(
        new FlashcardError("Database error", undefined, "DATABASE")
      );

      const request = new Request("http://localhost/api/flashcards", {
        method: "POST",
        body: JSON.stringify(createCommand),
      });

      // Act
      const response = await POST(createAPIContext(request));
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });
  });
});
