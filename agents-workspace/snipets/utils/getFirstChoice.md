# getFirstChoice

> 从 Chat Completion API 响应中安全获取第一个 choice，不存在则抛出错误

```ts
export const getFirstChoice = <T>(
  choices: Array<{ message: { content: T } }> | undefined
): { message: { content: T } } => {
  if (!choices || choices.length === 0) {
    throw new Error("No choices returned from API");
  }
  return choices[0];
};
```
