"use strict";

import { callAI, loadExistingRulesContext, getCommitDiff, getCommittedFiles, getCurrentCommit } from "../shared";
import type { ReviewRecord } from "../shared";
import { parseAIResponse } from "./ai-response";
import { shouldRunReview } from "./file-filter";
import { saveReview } from "./review-report";
import { getConfig } from "../root-config";

const MAX_RUNTIME_MS = getConfig().postCommitReviewMaxRuntimeMs ?? 20 * 60 * 1000;

const buildPostCommitReviewPrompt = (diff: string, existingRulesContext: string): string => {
  const extraRules = getConfig().reviewPromptExtra ?? "";
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

/**
 * 执行 post-commit 代码审查主流程
 * @description 获取最新 commit diff，调用 AI 分析，生成并保存审查报告
 */
export const runPostCommitReview = async (): Promise<void> => {
  console.log("🔍 Starting post-commit analysis...");

  const timeoutId = setTimeout(() => {
    const timeoutMinutes = Math.floor(MAX_RUNTIME_MS / (60 * 1000));
    console.error(`❌ 运行超时（${timeoutMinutes} 分钟），已强制退出`);
    process.exit(1);
  }, MAX_RUNTIME_MS);

  try {
    const { commitMessage, commitHash } = getCurrentCommit();
    console.log(`📌 Commit: ${commitHash.substring(0, 8)} — ${commitMessage}`);

    const committedFiles = getCommittedFiles();
    const { shouldRun, matchedFiles } = shouldRunReview(committedFiles);
    if (!shouldRun) {
      clearTimeout(timeoutId);
      console.log("ℹ️ No business/config files found in this commit, skipping analysis");
      return;
    }
    console.log(`🎯 Matched files for review: ${matchedFiles.join(", ")}`);

    const diff = getCommitDiff();
    if (!diff) {
      clearTimeout(timeoutId);
      console.log("ℹ️ No diff found (initial commit), skipping analysis");
      return;
    }

    const rulesContext = loadExistingRulesContext();
    const rawResponse = await callAI(buildPostCommitReviewPrompt(diff, rulesContext), true);
    const issues = parseAIResponse(rawResponse);

    console.log(`📝 Found ${issues.length} issues`);

    const record: ReviewRecord = {
      schemaVersion: "1",
      commitHash,
      commitMessage,
      timestamp: new Date().toISOString(),
      issues,
    };

    saveReview(record);
    clearTimeout(timeoutId);
    console.log("✅ Post-commit analysis completed!");
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("❌ Analysis failed:", (error as Error).message);
    process.exit(1);
  }
};
