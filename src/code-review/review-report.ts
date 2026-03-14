"use strict";

import * as fs from "fs";
import * as path from "path";
import { getDatetimeStr, TYPE_LABEL } from "../shared";
import type { IssueSeverity, IssueType, ReviewIssue, ReviewRecord } from "../shared";
import { getConfig } from "../root-config";

/**
 * 生成审查报告的 Markdown 文本
 * @param record 审查记录
 * @returns Markdown 格式的报告
 */
const buildMarkdown = (record: ReviewRecord): string => {
  const issuesByType = record.issues.reduce<Partial<Record<IssueType, ReviewIssue[]>>>(
    (acc, issue) => {
      (acc[issue.type] ??= []).push(issue);
      return acc;
    },
    {}
  );

  const severityDisplayMap: Record<IssueSeverity, string> = {
    critical: "严重",
    high: "高",
    medium: "中",
    low: "低",
  };

  let md = `## 代码审查报告\n`;
  md += `> Commit: \`${record.commitHash.substring(0, 8)}\` — ${record.commitMessage}\n\n`;

  let idx = 1;
  for (const type of (Object.keys(issuesByType) as IssueType[]).sort()) {
    const label = TYPE_LABEL[type] ?? type;
    md += `### ${label}\n`;
    for (const issue of issuesByType[type]!) {
      md += `- ${idx} [${issue.title}][${issue.description}] (严重程度: ${severityDisplayMap[issue.severity]})\n`;
      idx++;
    }
    md += "\n";
  }

  return md.trimEnd();
};

/**
 * 保存审查记录到文件系统（JSON + Markdown）
 * @param record 完整的审查记录
 */
export const saveReview = (record: ReviewRecord): void => {
  const config = getConfig();
  const outputDir = path.resolve(process.cwd(), config.codeReviewDir);
  fs.mkdirSync(outputDir, { recursive: true });
  const basename = path.join(outputDir, getDatetimeStr());
  fs.writeFileSync(`${basename}.json`, JSON.stringify(record, null, 2));
  fs.writeFileSync(`${basename}.md`, buildMarkdown(record));
  console.log(`✅ Saved review to ${basename}.{json,md}`);
};
