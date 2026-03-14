"use strict";

import { buildPostCommitReviewPrompt } from "../common.config";
import { callAI, loadExistingRulesContext, getCommitDiff, getCommittedFiles, getCurrentCommit } from "../shared";
import type { ReviewRecord } from "../shared";
import { parseAIResponse } from "./ai-response";
import { shouldRunReview } from "./file-filter";
import { saveReview } from "./review-report";

const MAX_RUNTIME_MS = 20 * 60 * 1000;

/**
 * 执行 post-commit 代码审查主流程
 * @description 获取最新 commit diff，调用 AI 分析，生成并保存审查报告
 */
export const runPostCommitReview = async (): Promise<void> => {
  console.log("🔍 Starting post-commit analysis...");

  const timeoutId = setTimeout(() => {
    console.error("❌ 运行超时（20 分钟），已强制退出");
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
