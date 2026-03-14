"use strict";

import { getConfig } from "./workspace-config";

export const MODEL_NAME = "Pro/zai-org/GLM-5";
export const API_BASE_URL = "https://api.siliconflow.cn/v1/chat/completions";

export const BUSINESS_CODE_FILE_PATTERNS: ReadonlyArray<RegExp> = [/\.(?:ts|tsx|js|jsx|json)$/i];

export const PROJECT_CONFIG_FILE_PATTERNS: ReadonlyArray<RegExp> = [
  /(^|\/)package\.json$/i,
  /(^|\/)pnpm-(?:lock|workspace)\.yaml$/i,
  /(^|\/)tsconfig(?:\..+)?\.json$/i,
  /(^|\/)\.cnb\.yml$/i,
  /(^|\/)(?:Dockerfile|docker-compose(?:\..+)?\.ya?ml)$/i,
  /(^|\/)\.env(?:\.[^/.]+)?(?:\.example)?$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)(?:\.eslintrc(?:\..+)?|eslint\.config\.(?:js|cjs|mjs|ts))$/i,
  /(^|\/)(?:\.prettierrc(?:\..+)?|prettier\.config\.(?:js|cjs|mjs|ts))$/i,
];

/**
 * 构建 post-commit 代码审查的 AI prompt
 * @param diff 代码 diff 内容
 * @param existingRulesContext 现有规则上下文
 * @returns 完整的 prompt 文本
 */
export const buildPostCommitReviewPrompt = (diff: string, existingRulesContext: string): string => {
  const config = getConfig();
  const extraRules = config.reviewPromptExtra ?? "";

  return `
你是一位资深代码审查工程师。请严格按照以下项目规范，分析代码 diff 并找出所有潜在问题。

## 项目规范摘要
${existingRulesContext}
${extraRules ? `\n## 额外审查规则\n${extraRules}` : ""}

## 待审查的代码 Diff
\`\`\`diff
${diff}
\`\`\`

请以 JSON 格式返回审查结果（**仅返回 JSON 对象，不要任何其他文字或 markdown**）：
{
  "issues": [
    {
      "type": "security | architecture | performance | code-style | maintainability | memory-leak | boundary",
      "title": "简短问题标题（15字以内）",
      "description": "详细描述：说明风险影响和建议修复方式",
      "severity": "critical | high | medium | low",
      "file": "受影响的文件路径，无法确定则为 null",
      "fingerprint": "kebab-case 语义短标识，同类问题跨 commit 必须保持一致，例如 hardcoded-api-key、typeorm-missing-equal、dry-violation-db-config"
    }
  ]
}
`.trim();
};
