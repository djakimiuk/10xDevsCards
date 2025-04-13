import "dotenv/config";
import fetch from "node-fetch";

const API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

const payload = {
  messages: [
    {
      role: "system",
      content:
        "You are a helpful assistant. You MUST respond in valid JSON format with two fields: 'answer' containing your response and 'reference' containing any relevant reference or context.",
    },
    {
      role: "user",
      content: "Tell me a short joke about programming.",
    },
  ],
  model: "qwen/qwen2.5-vl-3b-instruct:free",
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "ChatCompletionResponse",
      strict: true,
      schema: {
        answer: "string",
        reference: "string",
      },
    },
  },
  temperature: 0.7,
  max_tokens: 150,
};

console.log("Sending request to OpenRouter API...");
console.log("Using model:", payload.model);

fetch(API_URL, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
    "HTTP-Referer": "https://10xdevscards.com",
  },
  body: JSON.stringify(payload),
})
  .then((response) => response.json())
  .then((data) => {
    console.log("\nResponse:");
    console.log(JSON.stringify(data, null, 2));
  })
  .catch((error) => {
    console.error("Error:", error);
  });
