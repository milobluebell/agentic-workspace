"use strict";

import { getConfig } from "@milobluebell/agentic-workspace/src/root-config";

export interface ReviewExecutionDecision {
  shouldRun: boolean;
  matchedFiles: string[];
}

const config = getConfig();
const businessCodeFilePatterns = config.businessCodeFilePatterns;
const projectConfigFilePatterns = config.projectConfigFilePatterns;

const matchesAnyPattern = (filePath: string, patterns: ReadonlyArray<RegExp>): boolean =>
  patterns.some((pattern) => pattern.test(filePath));

/**
 * 判断本次 commit 的文件列表中是否包含需要审查的文件
 * @param committedFiles commit 中涉及的文件路径列表
 * @returns 是否需要执行审查及匹配的文件列表
 */
export const shouldRunReview = (committedFiles: string[]): ReviewExecutionDecision => {
  const matchedFiles = committedFiles.filter(
    (filePath) =>
      matchesAnyPattern(filePath, businessCodeFilePatterns) ||
      matchesAnyPattern(filePath, projectConfigFilePatterns)
  );
  return {
    shouldRun: matchedFiles.length > 0,
    matchedFiles,
  };
};
