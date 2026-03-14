"use strict";

import { execSync } from "child_process";
import type { CurrentCommitInfo } from "./types";

/**
 * 检查当前仓库是否为初始 commit（无历史记录）
 * @returns 是否为初始 commit
 */
export const isInitialCommit = (): boolean => {
  try {
    execSync("git log -1 --pretty=format:%h", { stdio: "pipe" });
    return false;
  } catch {
    return true;
  }
};

/**
 * 获取当前 HEAD commit 的信息
 * @returns commit message 和 hash
 */
export const getCurrentCommit = (): CurrentCommitInfo => {
  const commitMessage = execSync("git log -1 --pretty=format:%s").toString().trim();
  const commitHash = execSync("git rev-parse HEAD").toString().trim();
  return { commitMessage, commitHash };
};

/**
 * 获取当前 commit 涉及的变更文件列表
 * @returns 文件路径数组
 */
export const getCommittedFiles = (): string[] => {
  if (isInitialCommit()) return [];
  try {
    return execSync("git diff-tree --no-commit-id --name-only -r HEAD")
      .toString()
      .split("\n")
      .map((file) => file.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};
