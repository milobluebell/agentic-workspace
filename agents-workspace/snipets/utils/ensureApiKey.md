# ensureApiKey

> 从多个环境变量源依次获取 API Key，若均不存在则抛出错误

```ts
export const ensureApiKey = (
  envKeys: string[],
  fallback?: string
): string => {
  for (const key of envKeys) {
    const value = process.env[key];
    if (value) return value;
  }
  if (fallback) return fallback;
  throw new Error(`API key not found. Checked env vars: ${envKeys.join(", ")}`);
};
```
