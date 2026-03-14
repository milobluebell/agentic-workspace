"use strict";

import axios from "axios";
import { getConfig } from "../root-config";

interface SiliconFlowResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const API_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * 调用 SiliconFlow Chat API
 * @param prompt 用户消息内容
 * @param enableThinking 是否开启深度思考模式
 * @returns AI 响应文本
 * @throws 若 LLM_API_KEY 未设置或请求失败
 */
export const callAI = async (prompt: string, enableThinking = false): Promise<string> => {
  const config = getConfig();
  const apiKey = process.env["LLM_API_KEY"] ?? config.apiKey;
  if (!apiKey) {
    throw new Error(
      "LLM_API_KEY is not set, and no apiKey in workspace config"
    );
  }

  const response = await axios.post<SiliconFlowResponse>(
    config.apiBaseUrl,
    {
      model: config.modelName,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
      enable_thinking: enableThinking,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      timeout: API_TIMEOUT_MS,
    }
  );

  return response.data.choices[0].message.content;
};
