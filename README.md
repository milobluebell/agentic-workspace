# agentic-workspace

AI-powered code review, pattern aggregation, rule evolution and metrics toolkit.

## Install

```bash
pnpm add agentic-workspace
```

## CLI Commands

### `aw-review`

对最新 git commit 执行 AI 代码审查。分析 commit diff，调用 AI 模型检测安全、架构、性能、代码规范等维度的潜在问题，生成结构化的 JSON + Markdown 审查报告。

### `aw-patterns`

从所有历史审查记录中聚合问题模式。按 fingerprint 维度统计问题出现频次，区分 **recurring（3+ 次）** 和 **emerging（1-2 次）** 两类 pattern，输出分析报告。

### `aw-evolve`

基于 pattern 分析结果 + 现有 Cursor Rules，让 AI 自动生成规则新增/修改建议。输出 proposal Markdown 文件供人工审核后合并到规则库。

### `aw-metrics`

按 ISO 周聚合所有审查记录，计算 Severity Score、New Fingerprints、Recurring Issues 三项趋势指标，生成 Snowball Metrics 报告。

## Configuration

在项目根目录创建 `workspace.config.js` 或 `workspace.config.ts`：

```js
// workspace.config.js
module.exports = {
  modelName: "Pro/zai-org/GLM-5",
  apiBaseUrl: "https://api.siliconflow.cn/v1/chat/completions",
  codeReviewDir: "agents-workspace/code-review",
};
```

### Config Reference

| Name                        | Type                    | Default                                            | Required | Description                                         |
| --------------------------- | ----------------------- | -------------------------------------------------- | -------- | --------------------------------------------------- |
| `modelName`                 | `string`                | `"Pro/zai-org/GLM-5"`                              | No       | AI 模型名称                                         |
| `apiBaseUrl`                | `string`                | `"https://api.siliconflow.cn/v1/chat/completions"` | No       | AI API 请求地址                                     |
| `apiKey`                    | `string`                | `undefined`                                        | No       | SiliconFlow API Key，优先使用环境变量 `LLM_API_KEY` |
| `codeReviewDir`             | `string`                | `"agents-workspace/code-review"`                   | No       | 审查报告输出目录（相对于 cwd）                      |
| `patternsDir`               | `string`                | `"agents-workspace/patterns"`                      | No       | Pattern 聚合报告输出目录（相对于 cwd）              |
| `metricsDir`                | `string`                | `"agents-workspace/metrics"`                       | No       | Metrics 报告输出目录（相对于 cwd）                  |
| `rulesDir`                  | `string`                | `".cursor/rules"`                                  | No       | Cursor Rules 规则文件目录（相对于 cwd）             |
| `proposalsDir`              | `string`                | `".cursor/rule-proposals"`                         | No       | Rule 演化建议输出目录（相对于 cwd）                 |
| `reviewPromptExtra`         | `string`                | `undefined`                                        | No       | 追加到默认审查 prompt 的额外内容                    |
| `businessCodeFilePatterns`  | `ReadonlyArray<RegExp>` | `[/\.(?:ts\|tsx\|js\|jsx\|json)$/i]`               | No       | 业务代码文件匹配正则                                |
| `projectConfigFilePatterns` | `ReadonlyArray<RegExp>` | _(见源码)_                                         | No       | 项目配置文件匹配正则                                |

### Environment Variables

| Name          | Description                                                   | Required                           |
| ------------- | ------------------------------------------------------------- | ---------------------------------- |
| `LLM_API_KEY` | SiliconFlow API 密钥（推荐），优先级高于配置文件中的 `apiKey` | Yes（若配置文件中未设置 `apiKey`） |

## License

MIT
