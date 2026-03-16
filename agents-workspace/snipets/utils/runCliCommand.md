# runCliCommand

> CLI 入口点的统一执行包装器，处理异步命令执行和错误日志输出

```ts
export const runCliCommand = async (
  command: () => Promise<void>,
  label: string
): Promise<void> => {
  try {
    await command();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(`[${label}] Failed: ${message}`);
    process.exitCode = 1;
  }
};
```
