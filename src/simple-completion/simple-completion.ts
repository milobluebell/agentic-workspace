"use strict";

import { callAI, loadExistingRulesContext } from "../shared";

/**
 * 构建带 rules 上下文的完整 prompt
 * @param userPrompt 用户输入的 prompt
 * @param rulesContext 已加载的规则上下文
 * @returns 拼接后的完整 prompt
 */
const buildAskPrompt = (userPrompt: string, rulesContext: string): string =>
  `
你是一位资深工程师，以下是当前项目的编码规范与约束：

## 项目规范
${rulesContext}

---

请基于以上项目上下文回答：

${userPrompt}
`.trim();

/**
 * 解析 CLI 参数中的 --prompt=xxx
 * @param argv process.argv
 * @returns prompt 字符串，未找到则返回 null
 */
export const parsePromptArg = (argv: string[]): string | null => {
  for (const arg of argv) {
    if (arg.startsWith("--prompt=")) {
      return arg.slice("--prompt=".length);
    }
  }
  return null;
};

/**
 * 执行 simple-completion 主流程：加载 rules 上下文 + 调用 AI 对话
 * @param userPrompt 用户输入的 prompt 文本
 */
export const runSimpleCompletion = async (userPrompt: string): Promise<void> => {
  console.log("💬 Loading rules context...");
  const rulesContext = loadExistingRulesContext();

  const fullPrompt = buildAskPrompt(userPrompt, rulesContext);
  console.log("🤖 Calling LLM...\n");

  const response = await callAI(fullPrompt, false);
  console.log(response);
};
