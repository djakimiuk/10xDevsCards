import { z } from "zod";
import {
  ChatCompletionResponseSchema,
  ModelParamsSchema,
  MessageSchema,
  ResponseFormatSchema,
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
import { Logger } from "../logger";

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
  private readonly _logger: Logger;
  private readonly _defaultModel = "meta-llama/llama-4-maverick:free";
  private _testOptions: TestOptions;

  constructor(
    options = {
      isTest: false,
      testApiKey: "",
      testSiteUrl: "https://test.com",
      testModelName: "google/gemini-2.5-pro-exp-03-25:free",
      testSystemMessage: "You are a helpful assistant.",
    }
  ) {
    this._logger = new Logger("OpenRouterService");

    const apiKey = options.isTest ? options.testApiKey : import.meta.env.PUBLIC_OPENROUTER_API_KEY;

    if (!apiKey) {
      this._logger.error("Missing API key", { env: import.meta.env.MODE });
      throw new ValidationError("PUBLIC_OPENROUTER_API_KEY environment variable is not set");
    }

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

    this._logger.info("Initializing OpenRouter service", {
      model: this.modelName,
      systemMessage: this.systemMessage,
    });

    try {
      this.modelParams = ModelParamsSchema.parse({
        model: this.modelName,
        temperature: 0.7,
        max_tokens: 4000,
      });
    } catch (error) {
      this._logger.error("Invalid default model parameters", {}, error as Error);
      throw new ValidationError("Invalid default model parameters");
    }

    try {
      this.responseFormat = ResponseFormatSchema.parse({
        type: "json_schema",
        json_schema: {
          name: "ChatCompletionResponse",
          strict: true,
          schema: {
            flashcards: "array",
            reference: "string",
          },
        },
      });
    } catch (error) {
      this._logger.error("Invalid response format configuration", {}, error as Error);
      throw new ValidationError("Invalid response format configuration");
    }

    // Store site URL for tests
    this._testOptions = options;
  }

  private _validateMessage(message: Message): Message {
    try {
      return MessageSchema.parse(message);
    } catch (error) {
      this._logger.error(
        "Message validation failed",
        {
          role: message.role,
          contentLength: message.content.length,
        },
        error as Error
      );
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
    this._logger.debug("Formatting request payload", {
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
    this._logger.debug("Raw response received", { response });

    try {
      // First, try to parse the raw string directly
      try {
        const parsed = JSON.parse(response);

        // Check if this is already a valid format
        if (parsed.flashcards && Array.isArray(parsed.flashcards) && parsed.reference) {
          return ChatCompletionResponseSchema.parse(parsed);
        }
      } catch (error) {
        // If direct parsing fails, continue with standard flow
        this._logger.debug("Direct JSON parsing failed, trying alternative methods", {
          error: (error as Error).message,
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
          const contentObj = JSON.parse(content);
          return ChatCompletionResponseSchema.parse(contentObj);
        }
      } catch (error) {
        this._logger.debug("Response object parsing failed", {
          error: (error as Error).message,
        });
      }

      // Try to extract JSON from markdown code block
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[1].trim();
        this._logger.debug("Attempting to parse JSON from markdown", { jsonStr });

        try {
          const parsed = JSON.parse(jsonStr);
          return ChatCompletionResponseSchema.parse(parsed);
        } catch (error) {
          this._logger.error("Failed to parse JSON from markdown", { error, jsonStr });
          throw new ValidationError(`Invalid JSON in markdown: ${(error as Error).message}`);
        }
      }

      // At this point, we've exhausted all options
      throw new ValidationError("No valid JSON found in response");
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      this._logger.error("Failed to process OpenRouter response", { error, response });
      throw new ValidationError(`Failed to process response from OpenRouter: ${(error as Error).message}`);
    }
  }

  private async _retryWithExponentialBackoff<T>(operation: () => Promise<T>, retryCount = 0): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Don't retry certain errors
      if (error instanceof ValidationError) {
        throw error;
      }

      // Don't retry APIError with non-5xx status
      if (error instanceof APIError && (error.status < 500 || error.status >= 600)) {
        throw error;
      }

      if (retryCount >= this._maxRetries) {
        this._logger.error(`Max retries (${this._maxRetries}) reached`, { retryCount });

        // Ensure we're throwing the right error type
        if (error instanceof Error && error.message.includes("Failed to fetch")) {
          throw new NetworkError(error.message);
        }

        if (error instanceof NetworkError || error instanceof APIError) {
          throw error;
        }

        throw new NetworkError(`Max retries reached: ${(error as Error).message}`);
      }

      // Calculate exponential backoff delay with jitter
      const delay = this._baseDelay * Math.pow(2, retryCount) * (0.5 + Math.random() * 0.5);
      this._logger.warn(`Operation failed, retrying in ${Math.round(delay)}ms`, {
        retryCount: retryCount + 1,
        maxRetries: this._maxRetries,
        error: (error as Error).message,
      });

      // Wait for the backoff delay
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry with incremented count
      return this._retryWithExponentialBackoff(operation, retryCount + 1);
    }
  }

  private async _makeRequest(messages: Message[]): Promise<string> {
    const payload = this._formatPayload(messages);

    this._logger.debug("Making request to OpenRouter", {
      messageCount: messages.length,
      temperature: payload.temperature,
    });

    try {
      const response = await fetch(this._apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": this._testOptions.testSiteUrl,
        },
        body: JSON.stringify(payload),
      });

      // Handle HTTP errors
      if (!response.ok) {
        const statusCode = response.status;
        const errorMessage = `OpenRouter API error: ${response.status} ${response.statusText}`;
        this._logger.error("OpenRouter API error", {
          status: response.status,
          statusText: response.statusText,
        });

        // Handle 5xx errors differently for retry logic
        if (statusCode >= 500 && statusCode < 600) {
          throw new NetworkError(`Server error: ${statusCode} ${response.statusText}`);
        } else {
          throw new APIError(errorMessage, statusCode);
        }
      }

      // Parse JSON response
      const data = await response.json();
      this._logger.debug("Successfully received API response", {
        contentLength: JSON.stringify(data).length,
        choicesCount: data.choices?.length,
      });

      // Extract content directly
      if (data.choices && data.choices.length > 0 && data.choices[0].message && data.choices[0].message.content) {
        return data.choices[0].message.content;
      }

      // Fallback: return entire response as string
      return JSON.stringify(data);
    } catch (error) {
      this._logger.error("Failed to make OpenRouter API request", { error });
      if (error instanceof NetworkError || error instanceof APIError || error instanceof ValidationError) {
        throw error;
      }
      if (error instanceof Error && error.message.includes("Failed to fetch")) {
        throw new NetworkError(`Failed to fetch: ${error.message}`);
      }
      if (error instanceof Error) {
        throw new NetworkError(`API request failed: ${error.message}`);
      }
      throw new NetworkError("Failed to make OpenRouter API request");
    }
  }

  public async sendMessage(userMessage: string): Promise<ResponseType> {
    this._logger.info("Sending message to OpenRouter", {
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
      const responseText = await this._retryWithExponentialBackoff(() => this._makeRequest(messages));

      // Parse and validate the response
      return this._parseResponse(responseText);
    } catch (error) {
      this._logger.error(
        "Message sending failed",
        {
          messageLength: userMessage.length,
          model: this.modelName,
        },
        error as Error
      );
      throw error; // Re-throw with original error class preserved
    }
  }

  public setModelParams(params: ModelParams): void {
    this._logger.info("Updating model parameters", { newParams: params });
    try {
      this.modelParams = ModelParamsSchema.parse(params);
    } catch (error) {
      this._logger.error("Invalid model parameters", { params }, error as Error);
      throw new ValidationError(`Invalid model parameters: ${(error as Error).message}`);
    }
  }

  public getResponse(): ResponseType {
    this._logger.warn("getResponse() called - method not implemented", {});
    throw new Error("getResponse() must be called after sendMessage()");
  }
}
