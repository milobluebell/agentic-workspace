# safeMergeConfig

> 合并配置对象，确保默认值不会被用户配置中的 undefined 值覆盖

```ts
export const safeMergeConfig = <T extends object>(defaults: T, overrides: Partial<T>): T => {
  const result = { ...defaults, ...overrides };
  (Object.keys(defaults) as Array<keyof T>).forEach((key) => {
    if (result[key] === undefined) {
      result[key] = defaults[key];
    }
  });
  return result;
};
```
