"use strict";

import axios from "axios";
import { getConfig } from "../root-config";

interface ChatCompletionsResponse {
  choices: Array<{
    message: {
      content: unknown;
    };
  }>;
}

const API_TIMEOUT_MS = 10 * 60 * 1000;

const resolveMessageContent = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (!item || typeof item !== "object") return "";
        if ("text" in item && typeof item.text === "string") return item.text;
        return "";
      })
      .join("")
      .trim();
  }
  return "";
};

export const callAI = async (prompt: string, enableThinking = false): Promise<string> => {
  const config = getConfig();
  const llmProtocol = config.llmProtocol ?? "siliconflow";
  const apiKey = process.env["LLM_API_KEY"] ?? process.env["OPENAI_API_KEY"] ?? config.apiKey;
  if (!apiKey) {
    throw new Error("LLM_API_KEY/OPENAI_API_KEY is not set, and no apiKey in workspace config");
  }

  const requestBody: Record<string, unknown> = {
    model: config.modelName,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1,
  };
  if (llmProtocol === "siliconflow") {
    requestBody["enable_thinking"] = enableThinking;
  }

  const response = await axios.post<ChatCompletionsResponse>(
    config.apiBaseUrl,
    requestBody,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: API_TIMEOUT_MS,
    }
  );

  const firstChoice = response.data.choices[0];
  if (!firstChoice) {
    throw new Error("No choices returned from LLM API");
  }
  const content = resolveMessageContent(firstChoice.message.content);
  if (!content) {
    throw new Error("Empty content returned from LLM API");
  }
  return content;
};
