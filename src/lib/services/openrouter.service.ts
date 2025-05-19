import { z } from "zod";
import {
  ChatCompletionResponseSchema,
  ModelParamsSchema,
  MessageSchema,
  ValidationError,
  NetworkError,
  APIError,
} from "./openrouter.types";
import type {
  ResponseType,
  ResponseFormat,
  Message,
  GenerateFlashcardsResponse,
  ModelParams,
} from "./openrouter.types";
import { logger } from "../logger";

// Define interface for test options
interface TestOptions {
  isTest: boolean;
  testApiKey: string;
  testSiteUrl: string;
  testModelName: string;
  testSystemMessage: string;
}

export class OpenRouterService {
  // Public fields
  public readonly apiKey: string;
  public systemMessage: string;
  public modelName: string;
  public modelParams: ModelParams;
  public responseFormat: ResponseFormat;

  // Private fields
  private readonly _apiEndpoint = "https://openrouter.ai/api/v1/chat/completions";
  private readonly _maxRetries = 3;
  private readonly _baseDelay = 1000; // 1 second
  private readonly _defaultModel = "mistralai/mistral-7b-instruct:free";
  private _testOptions: TestOptions;

  constructor(
    options = {
      isTest: false,
      testApiKey: "",
      testSiteUrl: "https://test.com",
      testModelName: "mistralai/mistral-7b-instruct:free",
      testSystemMessage: "You are a helpful assistant.",
    }
  ) {
    const apiKey = options.isTest ? options.testApiKey : import.meta.env.PUBLIC_OPENROUTER_API_KEY;

    if (!apiKey) {
      logger.error("Missing API key", { env: import.meta.env.MODE });
      throw new ValidationError("PUBLIC_OPENROUTER_API_KEY environment variable is not set");
    }

    // Mask the API key for logging (show only the first 8 chars)
    const maskedKey = apiKey.substring(0, 8) + "...";
    logger.info("Using OpenRouter API key", { maskedKey });

    this.apiKey = apiKey;
    this.systemMessage = options.isTest
      ? options.testSystemMessage
      : `You are an expert educational flashcard creator. Your task is to analyze the provided text and create effective flashcards for learning. You MUST generate at least 3-5 flashcards for any given text.

For each important concept, create a flashcard following these rules:
1. Front: Create a clear, specific question that tests understanding
2. Back: Provide a concise but complete answer
3. Confidence: Rate how important this concept is (0.7-1.0 for key concepts)
4. Explanation: Explain why this concept is important to learn

You MUST respond in valid JSON format with:
- 'flashcards': array of flashcard objects, each containing:
  - 'front': question/prompt (string)
  - 'back': answer/explanation (string)
  - 'confidence': number between 0.7 and 1.0
  - 'explanation': importance explanation (string)
- 'reference': brief summary of the analyzed text

Example response format:
{
  "flashcards": [
    {
      "front": "What is the key advantage of X over Y?",
      "back": "X provides better performance by implementing Z",
      "confidence": 0.9,
      "explanation": "Understanding this difference is crucial for system design"
    }
  ],
  "reference": "The text explains the comparison between X and Y..."
}

Focus on creating flashcards that:
- Test understanding of core concepts
- Cover key definitions and terminology
- Highlight relationships between concepts
- Address common misconceptions
- Include practical examples

Remember: You MUST generate at least 3-5 high-quality flashcards for the given text.`;
    this.modelName = options.isTest ? options.testModelName : this._defaultModel;

    logger.info("Initializing OpenRouter service", {
      model: this.modelName,
      systemMessage: this.systemMessage.substring(0, 100) + "...", // Log only first 100 chars of system message
    });

    try {
      this.modelParams = ModelParamsSchema.parse({
        model: this.modelName,
        temperature: 0.7,
        max_tokens: 4000,
      });
    } catch (error) {
      logger.error("Invalid default model parameters", { error });
      throw new ValidationError("Invalid default model parameters");
    }

    // Użyj prostego formatu JSON bez schemy, który jest lepiej obsługiwany przez OpenRouter
    this.responseFormat = {
      type: "json_object",
    };
    logger.debug("Using response format", { format: this.responseFormat });

    // Store site URL for tests
    this._testOptions = options;
  }

  private _validateMessage(message: Message): Message {
    try {
      return MessageSchema.parse(message);
    } catch (error) {
      logger.error("Message validation failed", {
        role: message.role,
        contentLength: message.content.length,
        error,
      });
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid message format: ${error.message}`);
      }
      throw new ValidationError("Invalid message format");
    }
  }

  private _formatPayload(messages: Message[]): {
    messages: Message[];
    model: string;
    response_format: { type: string };
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    frequency_penalty?: number;
    presence_penalty?: number;
  } {
    logger.debug("Formatting request payload", {
      modelName: this.modelName,
      messageCount: messages.length,
    });

    return {
      messages,
      response_format: this.responseFormat,
      ...this.modelParams,
    };
  }

  private _parseResponse(response: string): GenerateFlashcardsResponse {
    logger.debug("Parsing response", { responseLength: response.length });

    try {
      // First, try to parse the raw string directly
      try {
        const parsed = JSON.parse(response);

        // Check if this is already a valid format
        if (parsed.flashcards && Array.isArray(parsed.flashcards) && parsed.reference) {
          logger.debug("Found valid JSON response directly");
          return ChatCompletionResponseSchema.parse(parsed);
        }
      } catch (error) {
        // If direct parsing fails, continue with standard flow
        const errorMessage = error instanceof Error ? error.message : "Unknown parsing error";
        logger.debug("Direct JSON parsing failed, trying alternative methods", {
          errorMessage,
        });
      }

      // Try to parse as a response object
      try {
        const responseObj = JSON.parse(response);

        // Handle the case where response was not extracted properly in _makeRequest
        if (
          responseObj.choices &&
          responseObj.choices.length > 0 &&
          responseObj.choices[0].message &&
          responseObj.choices[0].message.content
        ) {
          const content = responseObj.choices[0].message.content;
          logger.debug("Found content in OpenRouter response object", {
            contentPreview: content.substring(0, 50) + "...",
          });

          try {
            const contentObj = JSON.parse(content);
            if (contentObj.flashcards && Array.isArray(contentObj.flashcards)) {
              logger.debug("Successfully parsed content as flashcards JSON");
              return ChatCompletionResponseSchema.parse(contentObj);
            }
          } catch (parseError) {
            const errorMessage = parseError instanceof Error ? parseError.message : "Unknown parsing error";
            logger.debug("Failed to parse content as JSON", { errorMessage });
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown parsing error";
        logger.debug("Response object parsing failed", {
          errorMessage,
        });
      }

      // Try to extract JSON from markdown code block
      const jsonMatch = response.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1].trim();
        logger.debug("Found JSON in markdown code block", {
          jsonPreview: jsonStr.substring(0, 50) + (jsonStr.length > 50 ? "..." : ""),
        });

        try {
          const parsed = JSON.parse(jsonStr);
          logger.debug("Successfully parsed JSON from markdown");
          return ChatCompletionResponseSchema.parse(parsed);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown parsing error";
          logger.error("Failed to parse JSON from markdown", { errorMessage, jsonPreview: jsonStr.substring(0, 100) });
          throw new ValidationError(`Invalid JSON in markdown: ${errorMessage}`);
        }
      }

      // Try one more approach: look for JSON-like structures without code blocks
      const jsonPattern = /\{\s*"flashcards"\s*:\s*\[[\s\S]*\]\s*,\s*"reference"\s*:\s*"[\s\S]*"\s*\}/;
      const jsonPatternMatch = response.match(jsonPattern);
      if (jsonPatternMatch) {
        const possibleJson = jsonPatternMatch[0];
        logger.debug("Found potential JSON structure in response", {
          jsonPreview: possibleJson.substring(0, 50) + "...",
        });

        try {
          const parsed = JSON.parse(possibleJson);
          logger.debug("Successfully parsed JSON from pattern match");
          return ChatCompletionResponseSchema.parse(parsed);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown parsing error";
          logger.error("Failed to parse JSON from pattern match", { errorMessage });
        }
      }

      // At this point, we've exhausted all options
      logger.error("No valid JSON found in response", { responsePreview: response.substring(0, 200) });
      throw new ValidationError("No valid JSON found in response");
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to process OpenRouter response", {
        errorMessage,
        responsePreview: response.substring(0, 100),
      });
      throw new ValidationError(`Failed to process response from OpenRouter: ${errorMessage}`);
    }
  }

  private async _retryWithExponentialBackoff<T>(operation: () => Promise<T>, retryCount = 0): Promise<T> {
    const maxAttempts = this._maxRetries + 1; // +1 for initial attempt
    let currentAttempt = 0;
    const retryId = Math.random().toString(36).substring(7);

    logger.debug(`[Retry ${retryId}] Starting retry sequence:`, {
      maxRetries: this._maxRetries,
      maxAttempts,
      retryCount,
      isTestMode: this._testOptions.isTest,
      testApiKey: this._testOptions.testApiKey?.substring(0, 8) + "...",
      testSiteUrl: this._testOptions.testSiteUrl,
    });

    while (currentAttempt < maxAttempts) {
      logger.debug(`[Retry ${retryId}] Attempt ${currentAttempt + 1}/${maxAttempts}`, {
        currentAttempt,
        retryCount,
        delay: currentAttempt > 0 ? Math.pow(2, currentAttempt - 1) * 1000 : 0,
      });

      try {
        const result = await operation();
        logger.debug(`[Retry ${retryId}] Operation successful on attempt ${currentAttempt + 1}`);
        return result;
      } catch (error) {
        currentAttempt++;

        logger.debug(`[Retry ${retryId}] Error on attempt ${currentAttempt}:`, {
          error: error instanceof Error ? error.message : "Unknown error",
          type: error?.constructor?.name,
          isNetworkError: error instanceof Error && error.message.includes("Failed to fetch"),
          isAPIError: error instanceof APIError,
          currentAttempt,
          maxAttempts,
          shouldRetry:
            currentAttempt < maxAttempts &&
            !(error instanceof ValidationError) &&
            !(error instanceof APIError && (error.status < 500 || error.status >= 600)),
        });

        // Don't retry certain errors
        if (error instanceof ValidationError) {
          throw error;
        }

        // Don't retry APIError with non-5xx status
        if (error instanceof APIError && (error.status < 500 || error.status >= 600)) {
          throw error;
        }

        if (currentAttempt === maxAttempts) {
          logger.debug(`[Retry ${retryId}] Max retries reached, throwing final error`);

          // Ensure we're throwing the right error type
          if (error instanceof Error && error.message.includes("Failed to fetch")) {
            throw new NetworkError(error.message);
          }

          if (error instanceof NetworkError || error instanceof APIError) {
            throw error;
          }

          throw new NetworkError("Max retries reached");
        }

        // Wait before next retry using exponential backoff
        const delay = Math.pow(2, currentAttempt - 1) * 1000;
        if (currentAttempt < maxAttempts) {
          logger.debug(`[Retry ${retryId}] Waiting ${delay}ms before next attempt`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new NetworkError("Max retries reached");
  }

  private async _makeRequest(messages: Message[]): Promise<string> {
    const payload = this._formatPayload(messages);
    const siteUrl = this._testOptions.isTest ? this._testOptions.testSiteUrl : "http://localhost:3000";

    const result = await fetch(this._apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        "HTTP-Referer": siteUrl,
      },
      body: JSON.stringify(payload),
    });

    // Handle HTTP errors
    if (!result.ok) {
      const statusCode = result.status;
      let errorData;
      try {
        errorData = await result.json();
      } catch {
        errorData = { error: "Could not parse error response" };
      }

      const errorMessage = `OpenRouter API error: ${result.status} ${result.statusText}`;
      logger.error("OpenRouter API error", {
        status: result.status,
        statusText: result.statusText,
        errorData,
      });

      // Handle 5xx errors differently for retry logic
      if (statusCode >= 500 && statusCode < 600) {
        throw new NetworkError(`Server error: ${statusCode} ${result.statusText}`);
      } else {
        throw new APIError(errorMessage, statusCode);
      }
    }

    // Parse JSON response
    const data = await result.json();
    logger.debug("Successfully received API response", {
      contentLength: JSON.stringify(data).length,
      choicesCount: data.choices?.length,
    });

    // Log first 100 chars of the response for debugging
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      const content = data.choices[0].message.content;
      logger.debug("API response content preview", {
        preview: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
      });
    }

    // Extract content directly
    if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content;
    }

    // Fallback: return entire response as string
    return JSON.stringify(data);
  }

  public async sendMessage(userMessage: string): Promise<ResponseType> {
    logger.info("Sending message to OpenRouter", {
      messageLength: userMessage.length,
      model: this.modelName,
    });

    try {
      // Prepare messages array with system prompt and user message
      const messages: Message[] = [
        {
          role: "system",
          content: this.systemMessage,
        },
        this._validateMessage({
          role: "user",
          content: userMessage,
        }),
      ];

      // Make request with retry logic
      const responseText = await this._retryWithExponentialBackoff(async () => {
        try {
          return await this._makeRequest(messages);
        } catch (error) {
          if (error instanceof Error && error.message.includes("Failed to fetch")) {
            throw new NetworkError(error.message);
          }
          throw error;
        }
      });

      // Parse and validate the response
      return this._parseResponse(responseText);
    } catch (error) {
      logger.error("Message sending failed", {
        messageLength: userMessage.length,
        model: this.modelName,
        error,
      });
      throw error; // Re-throw with original error class preserved
    }
  }

  public setModelParams(params: ModelParams): void {
    logger.info("Updating model parameters", { newParams: params });
    try {
      this.modelParams = ModelParamsSchema.parse(params);
    } catch (error) {
      logger.error("Invalid model parameters", { params }, error as Error);
      throw new ValidationError(`Invalid model parameters: ${(error as Error).message}`);
    }
  }

  public getResponse(): ResponseType {
    logger.warn("getResponse() called - method not implemented", {});
    throw new Error("getResponse() must be called after sendMessage()");
  }
}
