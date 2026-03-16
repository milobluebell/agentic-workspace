# Snipets Index

- Generated at: 2026-03-16T13:49:34.848Z

## components

> 暂无内容

## utils

| Name | Purpose | File |
| --- | --- | --- |
| `bootstrapCli` | 封装 CLI 命令入口点，统一处理异步执行、错误捕获、日志记录与退出码设置 | `utils/bootstrapCli.md` |
| `buildChatCompletionBody` | 构建 LLM Chat Completion API 请求体，支持不同协议的差异化参数 | `utils/buildChatCompletionBody.md` |
| `ensureApiKey` | 从多个环境变量源依次获取 API Key，若均不存在则抛出错误 | `utils/ensureApiKey.md` |
| `extractErrorMessage` | 从 unknown 错误类型中安全提取错误信息字符串，优先返回堆栈跟踪 | `utils/extractErrorMessage.md` |
| `formatCliError` | 将未知错误对象格式化为字符串消息，优先输出堆栈信息以便于调试 CLI 错误。 | `utils/formatCliError.md` |
| `getFirstChoice` | 从 Chat Completion API 响应中安全获取第一个 choice，不存在则抛出错误 | `utils/getFirstChoice.md` |
| `resolveMessageContent` | 从 LLM API 响应中解析消息内容，支持纯文本和结构化内容数组格式。 | `utils/resolveMessageContent.md` |
| `runCliCommand` | CLI 入口点的统一执行包装器，处理异步命令执行和错误日志输出 | `utils/runCliCommand.md` |
| `safeMergeConfig` | 合并配置对象，确保默认值不会被用户配置中的 undefined 值覆盖 | `utils/safeMergeConfig.md` |
