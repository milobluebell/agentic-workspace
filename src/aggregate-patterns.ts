"use strict";

import * as fs from "fs";
import * as path from "path";
import {
  SEVERITY_WEIGHTS,
  TYPE_LABEL,
  SEVERITY_LABEL,
  getISOWeekLabel,
  readAllFiles,
} from "./shared";
import type {
  ReviewRecord,
  PatternEntry,
  IssueType,
  IssueSeverity,
} from "./shared";
import { getConfig } from "./workspace-config";

interface PatternsSnapshot {
  generatedAt: string;
  weekLabel: string;
  totalCommits: number;
  recurring: PatternEntry[];
  emerging: PatternEntry[];
}

const compareMaxSeverity = (a: IssueSeverity, b: IssueSeverity): IssueSeverity =>
  SEVERITY_WEIGHTS[a] >= SEVERITY_WEIGHTS[b] ? a : b;

/**
 * 读取所有结构化 review JSON 文件，按文件名排序
 * @returns ReviewRecord 列表
 */
const loadAllReviews = (): ReviewRecord[] => {
  const config = getConfig();
  const reviewDir = path.resolve(process.cwd(), config.codeReviewDir);
  return readAllFiles(reviewDir, ".json").map(
    (f) => JSON.parse(f.content) as ReviewRecord
  );
};

/**
 * 将所有 review 记录聚合为 fingerprint 维度的 pattern 列表
 * @param reviews 所有 review 记录
 * @returns 按出现次数降序排列的 PatternEntry 列表
 */
const aggregatePatterns = (reviews: ReviewRecord[]): PatternEntry[] => {
  const map = new Map<string, PatternEntry>();

  for (const review of reviews) {
    for (const issue of review.issues) {
      const existing = map.get(issue.fingerprint);
      if (existing) {
        existing.occurrences++;
        existing.maxSeverity = compareMaxSeverity(existing.maxSeverity, issue.severity);
        existing.lastSeen = review.timestamp.split("T")[0];
        if (!existing.commits.includes(review.commitHash)) {
          existing.commits.push(review.commitHash);
        }
      } else {
        map.set(issue.fingerprint, {
          fingerprint: issue.fingerprint,
          title: issue.title,
          type: issue.type,
          maxSeverity: issue.severity,
          occurrences: 1,
          firstSeen: review.timestamp.split("T")[0],
          lastSeen: review.timestamp.split("T")[0],
          commits: [review.commitHash],
        });
      }
    }
  }

  return Array.from(map.values()).sort((a, b) => b.occurrences - a.occurrences);
};

/**
 * 构建 Pattern 聚合报告的 Markdown
 * @param snapshot 快照数据
 * @returns Markdown 格式报告
 */
const buildMarkdown = (snapshot: PatternsSnapshot): string => {
  const { weekLabel, totalCommits, recurring, emerging } = snapshot;
  const now = new Date().toISOString().split("T")[0];

  let md = `# Pattern Aggregation Report\n\n`;
  md += `**生成时间**: ${now} | **当前周**: ${weekLabel} | **累计分析 Commits**: ${totalCommits}\n\n`;

  md += `## 🔁 重复 Anti-Patterns（3+ 次出现）\n\n`;
  if (recurring.length === 0) {
    md += `> ✅ 暂无重复问题，雪球效果良好！\n\n`;
  } else {
    md += `| Fingerprint | 标题 | 类型 | 最高严重度 | 出现次数 | 首次发现 | 最近发现 |\n`;
    md += `|-------------|------|------|----------|---------|---------|--------|\n`;
    for (const p of recurring) {
      md += `| \`${p.fingerprint}\` | ${p.title} | ${TYPE_LABEL[p.type] ?? p.type} | ${SEVERITY_LABEL[p.maxSeverity]} | **${p.occurrences}** | ${p.firstSeen} | ${p.lastSeen} |\n`;
    }
    md += "\n";
  }

  md += `## 🌱 新兴 Patterns（1-2 次出现）\n\n`;
  if (emerging.length === 0) {
    md += `> ✅ 暂无新增问题类型\n\n`;
  } else {
    md += `| Fingerprint | 标题 | 类型 | 严重度 | 出现次数 | 首次发现 |\n`;
    md += `|-------------|------|------|--------|---------|--------|\n`;
    for (const p of emerging) {
      md += `| \`${p.fingerprint}\` | ${p.title} | ${TYPE_LABEL[p.type] ?? p.type} | ${SEVERITY_LABEL[p.maxSeverity]} | ${p.occurrences} | ${p.firstSeen} |\n`;
    }
    md += "\n";
  }

  md += `---\n`;
  md += `> 下一步：运行 \`aw-evolve\` 让 AI 根据以上 patterns 生成规则演化建议\n`;

  return md.trimEnd();
};

/**
 * 执行 Pattern 聚合分析主流程
 * @description 读取所有 review 历史，按 fingerprint 聚合，生成 recurring/emerging 分类报告
 */
export const runAggregatePatterns = (): void => {
  console.log("🔍 Aggregating patterns from review history...");

  const reviews = loadAllReviews();
  if (reviews.length === 0) {
    console.log("ℹ️ No structured review data (.json files) found.");
    console.log("   Tip: JSON files are generated from the next git commit onwards.");
    process.exit(0);
  }

  console.log(`📊 Loaded ${reviews.length} review records`);

  const allPatterns = aggregatePatterns(reviews);
  const recurring = allPatterns.filter((p) => p.occurrences >= 3);
  const emerging = allPatterns.filter((p) => p.occurrences < 3);

  const snapshot: PatternsSnapshot = {
    generatedAt: new Date().toISOString(),
    weekLabel: getISOWeekLabel(),
    totalCommits: reviews.length,
    recurring,
    emerging,
  };

  const config = getConfig();
  const patternsDir = path.resolve(process.cwd(), config.patternsDir);
  fs.mkdirSync(patternsDir, { recursive: true });
  const timestamp = new Date().toISOString().split("T")[0];
  const jsonPath = path.join(patternsDir, `${timestamp}.json`);
  const mdPath = path.join(patternsDir, `${timestamp}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(snapshot, null, 2));
  fs.writeFileSync(mdPath, buildMarkdown(snapshot));

  console.log(`✅ Pattern analysis saved to ${mdPath}`);
  console.log(`   Recurring anti-patterns : ${recurring.length}`);
  console.log(`   Emerging patterns       : ${emerging.length}`);
};
