# formatCliError

> 将未知错误对象格式化为字符串消息，优先输出堆栈信息以便于调试 CLI 错误。

```ts
export const formatCliError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.stack ?? error.message;
  }
  return String(error);
};
```
