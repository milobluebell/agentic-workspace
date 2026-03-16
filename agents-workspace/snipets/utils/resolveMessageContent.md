# resolveMessageContent

> 从 LLM API 响应中解析消息内容，支持纯文本和结构化内容数组格式。

```ts
export const resolveMessageContent = (content: unknown): string => {
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
```
