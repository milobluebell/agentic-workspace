"use strict";

import { execSync } from "child_process";
import { isInitialCommit } from "./git-files";

/**
 * 获取当前 commit 与前一次 commit 的 diff 内容
 * @returns diff 文本，初始 commit 返回空字符串
 */
export const getCommitDiff = (): string => {
  if (isInitialCommit()) return "";
  try {
    return execSync("git diff HEAD^ HEAD").toString();
  } catch {
    return "";
  }
};
