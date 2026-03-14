"use strict";

import { execFileSync } from "child_process";
import { isInitialCommit } from "./git-files";

/**
 * 获取当前 commit 与前一次 commit 的 diff 内容
 * @param files 可选文件路径列表；传入后仅返回这些文件在当前提交中的 diff
 * @returns diff 文本，初始 commit 返回空字符串
 */
export const getCommitDiff = (files: ReadonlyArray<string> = []): string => {
  try {
    const fileArgs = files.length > 0 ? ["--", ...files] : [];
    if (isInitialCommit()) {
      return execFileSync("git", ["show", "--pretty=format:", "HEAD", ...fileArgs]).toString();
    }
    return execFileSync("git", ["diff", "HEAD^", "HEAD", ...fileArgs]).toString();
  } catch {
    return "";
  }
};
