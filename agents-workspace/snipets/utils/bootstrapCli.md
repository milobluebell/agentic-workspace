# bootstrapCli

> 封装 CLI 命令入口点，统一处理异步执行、错误捕获、日志记录与退出码设置

```ts
export const bootstrapCli = (name: string, main: () => Promise<void>) => {
  Promise.resolve()
    .then(() => main())
    .catch((error: unknown) => {
      const message = error instanceof Error ? error.stack ?? error.message : String(error);
      console.error(`[${name}] Failed: ${message}`);
      process.exitCode = 1;
    });
};
```
