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
      throw error;
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
      throw error;
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
      throw error;
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
      // Parse the raw response as JSON first
      const responseObj = JSON.parse(response);

      if (!responseObj.choices?.[0]?.message?.content) {
        throw new ValidationError("Invalid response structure from OpenRouter API");
      }

      const content = responseObj.choices[0].message.content;

      // Try to extract JSON from markdown code block
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        // If no markdown block found, try to parse the content directly
        try {
          const parsed = JSON.parse(content);
          return ChatCompletionResponseSchema.parse(parsed);
        } catch {
          throw new ValidationError("No valid JSON found in response");
        }
      }

      const jsonStr = jsonMatch[1].trim();
      this._logger.debug("Attempting to parse JSON string", { jsonStr });

      let parsed;
      try {
        parsed = JSON.parse(jsonStr);
      } catch (error) {
        this._logger.error("Failed to parse JSON response", { error, jsonStr });
        throw new ValidationError(`Invalid JSON response from OpenRouter: ${(error as Error).message}`);
      }

      this._logger.debug("Successfully parsed JSON", { parsed });

      // Validate the parsed response against our schema
      try {
        const validated = ChatCompletionResponseSchema.parse(parsed);

        // Additional validation for flashcards array
        if (!validated.flashcards || validated.flashcards.length === 0) {
          throw new ValidationError("Response contains no flashcards");
        }

        // Log successful validation
        this._logger.debug("Response validation successful", {
          flashcardsCount: validated.flashcards.length,
          referenceLength: validated.reference.length,
        });

        return validated;
      } catch (error) {
        this._logger.error("Response validation failed", { error, parsed });
        if (error instanceof z.ZodError) {
          throw new ValidationError(`Response schema validation failed: ${error.message}`);
        }
        throw new ValidationError("Response does not match expected schema");
      }
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
      if (error instanceof NetworkError || (error instanceof APIError && error.status >= 500)) {
        if (retryCount < this._maxRetries) {
          const delay = this._baseDelay * Math.pow(2, retryCount);
          this._logger.warn("Retrying failed request", {
            retryCount: retryCount + 1,
            maxRetries: this._maxRetries,
            delayMs: delay,
            errorType: error.constructor.name,
            errorMessage: error.message,
          });

          await new Promise((resolve) => setTimeout(resolve, delay));
          return this._retryWithExponentialBackoff(operation, retryCount + 1);
        }

        this._logger.error(
          "Max retries exceeded",
          {
            maxRetries: this._maxRetries,
            errorType: error.constructor.name,
          },
          error as Error
        );
      }
      throw error;
    }
  }

  private async _makeRequest(messages: Message[], modelParams: ModelParams): Promise<string> {
    const requestBody = this._formatPayload(messages);

    this._logger.debug("Making request to OpenRouter", {
      messageCount: messages.length,
      temperature: modelParams.temperature,
    });

    try {
      // Get site URL from options in test mode
      const siteUrl = this._testOptions.isTest ? this._testOptions.testSiteUrl : import.meta.env.PUBLIC_SITE_URL;

      if (!siteUrl) {
        throw new ValidationError("PUBLIC_SITE_URL environment variable is not set");
      }

      const response = await fetch(this._apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": siteUrl,
          "X-Title": import.meta.env.PUBLIC_APP_TITLE,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        this._logger.error("OpenRouter API request failed", {
          status: response.status,
          statusText: response.statusText,
          errorBody,
        });
        throw new Error(`OpenRouter API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
        this._logger.error("Invalid API response structure", { data });
        throw new Error("Invalid response structure from OpenRouter API");
      }

      const content = data.choices[0]?.message?.content;
      if (!content) {
        this._logger.error("No content in API response", { data });
        throw new Error("No content received from OpenRouter API");
      }

      this._logger.debug("Successfully received API response", {
        contentLength: content.length,
        choicesCount: data.choices.length,
      });

      return content;
    } catch (error) {
      this._logger.error("Failed to make OpenRouter API request", { error });
      if (error instanceof Error) {
        throw new Error(`OpenRouter API request failed: ${error.message}`);
      }
      throw new Error("Failed to make OpenRouter API request");
    }
  }

  public async sendMessage(userMessage: string): Promise<ResponseType> {
    const requestLogger = this._logger.child("sendMessage");

    try {
      requestLogger.info("Sending message to OpenRouter", {
        messageLength: userMessage.length,
        model: this.modelName,
      });

      const systemMsg = this._validateMessage({
        role: "system",
        content: this.systemMessage,
      });

      const userMsg = this._validateMessage({
        role: "user",
        content: userMessage,
      });

      return await this._retryWithExponentialBackoff(async () => {
        try {
          const response = await this._makeRequest([systemMsg, userMsg], this.modelParams);
          const parsedResponse = this._parseResponse(response);
          const validatedResponse = ChatCompletionResponseSchema.parse(parsedResponse);

          this._logger.debug("Successfully parsed API response", {
            responseLength: response.length,
            flashcardsCount: validatedResponse.flashcards?.length ?? 0,
          });

          return validatedResponse;
        } catch (error) {
          if (error instanceof TypeError) {
            const networkError = new NetworkError("Network request failed");
            requestLogger.error(
              "Network request failed",
              {
                endpoint: this._apiEndpoint,
              },
              networkError
            );
            throw networkError;
          }
          throw error;
        }
      });
    } catch (error) {
      requestLogger.error(
        "Message sending failed",
        {
          messageLength: userMessage.length,
          model: this.modelName,
        },
        error as Error
      );
      throw error;
    }
  }

  public setModelParams(params: ModelParams): void {
    try {
      this._logger.info("Updating model parameters", { newParams: params });
      this.modelParams = ModelParamsSchema.parse(params);
    } catch (error) {
      this._logger.error("Invalid model parameters", { params }, error as Error);
      if (error instanceof z.ZodError) {
        throw new ValidationError(`Invalid model parameters: ${error.message}`);
      }
      throw error;
    }
  }

  public getResponse(): ResponseType {
    this._logger.warn("getResponse() called - method not implemented");
    throw new Error("getResponse() must be called after sendMessage()");
  }
}
