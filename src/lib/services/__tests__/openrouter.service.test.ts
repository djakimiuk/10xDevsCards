import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { OpenRouterService } from "../openrouter.service";
import { ValidationError, NetworkError, APIError } from "../openrouter.types";

describe("OpenRouterService", () => {
  const mockApiKey = "test-api-key";
  const mockSiteUrl = "https://test.com";
  let service: OpenRouterService;

  beforeEach(() => {
    // Mock environment variables
    process.env.OPENROUTER_API_KEY = mockApiKey;
    process.env.PUBLIC_SITE_URL = mockSiteUrl;

    // Mock fetch
    global.fetch = vi.fn();

    service = new OpenRouterService();
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.PUBLIC_SITE_URL;
  });

  describe("constructor", () => {
    it("should throw ValidationError when API key is not set", () => {
      delete process.env.OPENROUTER_API_KEY;
      expect(() => new OpenRouterService()).toThrow(ValidationError);
    });

    it("should initialize with default values", () => {
      expect(service.modelName).toBe("google/gemini-2.5-pro-exp-03-25:free");
      expect(service.systemMessage).toBe("You are a helpful assistant.");
      expect(service.modelParams).toEqual({
        temperature: 0.7,
        max_tokens: 150,
      });
    });
  });

  describe("setModelParams", () => {
    it("should update model parameters", () => {
      const newParams = {
        temperature: 0.5,
        max_tokens: 200,
      };
      service.setModelParams(newParams);
      expect(service.modelParams).toEqual(newParams);
    });

    it("should throw ValidationError for invalid parameters", () => {
      const invalidParams = {
        temperature: 3, // Should be between 0 and 2
        max_tokens: -1, // Should be positive
      };
      expect(() => service.setModelParams(invalidParams)).toThrow(ValidationError);
    });
  });

  describe("sendMessage", () => {
    const mockMessage = "Test message";
    const mockResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              answer: "Test answer",
              reference: "Test reference",
            }),
          },
        },
      ],
    };

    it("should send message and return parsed response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.sendMessage(mockMessage);

      expect(result).toEqual({
        answer: "Test answer",
        reference: "Test reference",
      });

      expect(global.fetch).toHaveBeenCalledWith("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${mockApiKey}`,
          "HTTP-Referer": mockSiteUrl,
        },
        body: expect.any(String),
      });
    });

    it("should retry on network error", async () => {
      const networkError = new TypeError("Failed to fetch");
      (global.fetch as jest.Mock).mockRejectedValueOnce(networkError).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await service.sendMessage(mockMessage);

      expect(result).toEqual({
        answer: "Test answer",
        reference: "Test reference",
      });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should retry on 5xx error", async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockResponse),
        });

      const result = await service.sendMessage(mockMessage);

      expect(result).toEqual({
        answer: "Test answer",
        reference: "Test reference",
      });
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it("should throw NetworkError after max retries", async () => {
      const networkError = new TypeError("Failed to fetch");
      (global.fetch as jest.Mock).mockRejectedValue(networkError);

      await expect(service.sendMessage(mockMessage)).rejects.toThrow(NetworkError);
      expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it("should throw APIError for non-5xx errors", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: "Bad Request",
      });

      await expect(service.sendMessage(mockMessage)).rejects.toThrow(APIError);
      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries
    });

    it("should throw ValidationError for invalid response format", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ choices: [] }), // Missing message content
      });

      await expect(service.sendMessage(mockMessage)).rejects.toThrow(ValidationError);
    });

    it("should throw ValidationError for invalid JSON in response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            choices: [{ message: { content: "invalid json" } }],
          }),
      });

      await expect(service.sendMessage(mockMessage)).rejects.toThrow(ValidationError);
    });
  });

  describe("getResponse", () => {
    it("should throw error as not implemented", () => {
      expect(() => service.getResponse()).toThrow("getResponse() must be called after sendMessage()");
    });
  });
});
