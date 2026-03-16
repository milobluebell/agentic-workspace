# buildChatCompletionBody

> 构建 LLM Chat Completion API 请求体，支持不同协议的差异化参数

```ts
export const buildChatCompletionBody = (
  model: string,
  prompt: string,
  options?: {
    temperature?: number;
    enableThinking?: boolean;
    protocol?: "siliconflow" | "openai-compatible";
  }
): Record<string, unknown> => {
  const body: Record<string, unknown> = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: options?.temperature ?? 0.1,
  };
  if (options?.protocol === "siliconflow" && options?.enableThinking) {
    body["enable_thinking"] = true;
  }
  return body;
};
```
