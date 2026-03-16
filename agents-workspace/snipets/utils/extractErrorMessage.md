# extractErrorMessage

> 从 unknown 错误类型中安全提取错误信息字符串，优先返回堆栈跟踪

```ts
export const extractErrorMessage = (error: unknown): string => {
  return error instanceof Error ? error.stack ?? error.message : String(error);
};
```
