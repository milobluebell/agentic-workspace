"use strict";

import * as path from "path";
import { getConfig } from "../workspace-config";
import { readAllFiles, pathExists } from "./file-reader";

/**
 * 加载项目下的 Cursor Rules 规则文件内容，作为 AI 上下文
 * @returns 拼接后的规则文本，每个文件以 ### filename 标题分隔
 */
export const loadExistingRulesContext = (): string => {
  const config = getConfig();
  const rulesDir = path.resolve(process.cwd(), config.rulesDir);
  if (!pathExists(rulesDir)) return "（无规则文件）";

  const files = readAllFiles(rulesDir, ".mdc");
  if (files.length === 0) return "（无规则文件）";

  return files.map((f) => `### ${f.filename}\n${f.content}`).join("\n\n");
};
