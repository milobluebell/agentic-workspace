"use strict";

import * as fs from "fs";
import * as path from "path";
import { SEVERITY_WEIGHTS, getISOWeekLabel, readAllFiles } from "./shared";
import type { ReviewRecord, IssueSeverity } from "./shared";
import { getConfig } from "./root-config";

interface WeekStats {
  weekLabel: string;
  commits: number;
  totalIssues: number;
  bySeverity: Record<IssueSeverity, number>;
  severityScore: number;
  newFingerprints: number;
  recurringFingerprints: number;
}

/**
 * 读取所有结构化 review JSON 文件
 * @returns ReviewRecord 列表，按文件名（时间）排序
 */
const loadAllReviews = (): ReviewRecord[] => {
  const config = getConfig();
  const reviewDir = path.resolve(process.cwd(), config.codeReviewDir);
  return readAllFiles(reviewDir, ".json").map(
    (f) => JSON.parse(f.content) as ReviewRecord
  );
};

/**
 * 将 review 列表按 ISO 周分组
 * @param reviews 所有 review 记录
 * @returns 以周标识为 key 的 Map
 */
const groupByWeek = (reviews: ReviewRecord[]): Map<string, ReviewRecord[]> => {
  const map = new Map<string, ReviewRecord[]>();
  for (const review of reviews) {
    const week = getISOWeekLabel(new Date(review.timestamp));
    if (!map.has(week)) map.set(week, []);
    map.get(week)!.push(review);
  }
  return map;
};

const calcTrend = (values: number[]): string => {
  if (values.length < 2) return "→";
  const last = values[values.length - 1];
  const prev = values[values.length - 2];
  if (last < prev) return "↓";
  if (last > prev) return "↑";
  return "→";
};

const calcSnowballStatus = (trend: string, isGoodWhenDown: boolean): string => {
  if (trend === "→") return "⚠️ 无变化";
  const improving = isGoodWhenDown ? trend === "↓" : trend === "↑";
  return improving ? "✅ 改善中" : "🔴 需关注";
};

/**
 * 构建 Metrics 报告 Markdown
 * @param weeklyStats 按周聚合的统计数据
 * @returns Markdown 报告文本
 */
const buildReport = (weeklyStats: WeekStats[]): string => {
  const now = new Date().toISOString().split("T")[0];
  let md = `# Snowball Metrics Report\n\n`;
  md += `**生成时间**: ${now}\n\n`;

  if (weeklyStats.length === 0) {
    md += `> ⚠️ 暂无结构化数据。JSON 格式的 review 记录将从下次 git commit 起自动生成。\n`;
    return md;
  }

  md += `## 📊 Weekly Trend\n\n`;
  md += `| 周次 | Commits | Total Issues | 🔴 Critical | 🟠 High | 🟡 Medium | 🟢 Low | Severity Score | 新 Fingerprints | 复发 Fingerprints |\n`;
  md += `|------|---------|-------------|------------|--------|----------|-------|---------------|----------------|------------------|\n`;
  for (const w of weeklyStats) {
    md += `| ${w.weekLabel} | ${w.commits} | ${w.totalIssues} | ${w.bySeverity.critical} | ${w.bySeverity.high} | ${w.bySeverity.medium} | ${w.bySeverity.low} | ${w.severityScore} | ${w.newFingerprints} | ${w.recurringFingerprints} |\n`;
  }
  md += "\n";

  const scoreValues = weeklyStats.map((w) => w.severityScore);
  const newFpValues = weeklyStats.map((w) => w.newFingerprints);
  const recurringValues = weeklyStats.map((w) => w.recurringFingerprints);

  const scoreTrend = calcTrend(scoreValues);
  const newFpTrend = calcTrend(newFpValues);
  const recurringTrend = calcTrend(recurringValues);

  md += `## ❄️→🔥 Snowball Indicators\n\n`;
  md += `| 指标 | 趋势 | 历史值（按周） | 状态 |\n`;
  md += `|------|------|--------------|------|\n`;
  md += `| **Severity Score** 每周加权得分 | ${scoreTrend} | ${scoreValues.join(" → ")} | ${calcSnowballStatus(scoreTrend, true)} |\n`;
  md += `| **New Fingerprints** 新问题类型数 | ${newFpTrend} | ${newFpValues.join(" → ")} | ${calcSnowballStatus(newFpTrend, true)} |\n`;
  md += `| **Recurring Issues** 复发问题数 | ${recurringTrend} | ${recurringValues.join(" → ")} | ${calcSnowballStatus(recurringTrend, true)} |\n`;

  md += `\n### 📖 指标说明\n\n`;
  md += `| 指标 | 公式 | 雪球信号 |\n`;
  md += `|------|------|--------|\n`;
  md += `| Severity Score | \`critical×4 + high×3 + medium×2 + low×1\` 周合计 | 持续↓ = AI 越来越少犯严重错误 |\n`;
  md += `| New Fingerprints | 本周首次出现的问题 fingerprint 数 | 持续↓ = AI 越来越熟悉你的代码 |\n`;
  md += `| Recurring Issues | 本周出现且历史 3+ 次的 fingerprint 数 | 持续↓ = 规则沉淀越来越有效 |\n`;

  md += `\n---\n`;
  md += `> 运行 \`aw-patterns\` 查看详细 pattern 分布\n`;
  md += `> 运行 \`aw-evolve\` 生成规则演化建议\n`;

  return md;
};

/**
 * 执行 Metrics 报告生成主流程
 * @description 按周聚合所有 review 记录，计算趋势指标，输出 Markdown 报告
 */
export const runMetricsReport = (): void => {
  console.log("📊 Generating metrics report...");

  const reviews = loadAllReviews();
  if (reviews.length === 0) {
    console.log("ℹ️ No structured review data found.");
    console.log("   JSON files are generated automatically from the next git commit.");
    process.exit(0);
  }

  console.log(`📂 Loaded ${reviews.length} review records`);

  const weekMap = groupByWeek(reviews);
  const sortedWeeks = [...weekMap.keys()].sort();

  const fpTotalOccurrences = new Map<string, number>();
  for (const review of reviews) {
    for (const issue of review.issues) {
      fpTotalOccurrences.set(
        issue.fingerprint,
        (fpTotalOccurrences.get(issue.fingerprint) ?? 0) + 1
      );
    }
  }

  const allSeenFingerprints = new Set<string>();
  const weeklyStats: WeekStats[] = [];

  for (const week of sortedWeeks) {
    const weekReviews = weekMap.get(week)!;
    const bySeverity: Record<IssueSeverity, number> = { critical: 0, high: 0, medium: 0, low: 0 };
    let severityScore = 0;
    let totalIssues = 0;
    const weekFingerprints = new Set<string>();
    let newFingerprints = 0;
    let recurringFingerprints = 0;

    for (const review of weekReviews) {
      for (const issue of review.issues) {
        bySeverity[issue.severity]++;
        severityScore += SEVERITY_WEIGHTS[issue.severity];
        totalIssues++;
        weekFingerprints.add(issue.fingerprint);
      }
    }

    for (const fp of weekFingerprints) {
      if (!allSeenFingerprints.has(fp)) {
        newFingerprints++;
        allSeenFingerprints.add(fp);
      }
      if ((fpTotalOccurrences.get(fp) ?? 0) >= 3) {
        recurringFingerprints++;
      }
    }

    weeklyStats.push({
      weekLabel: week,
      commits: weekReviews.length,
      totalIssues,
      bySeverity,
      severityScore,
      newFingerprints,
      recurringFingerprints,
    });
  }

  const report = buildReport(weeklyStats);

  const config = getConfig();
  const metricsDir = path.resolve(process.cwd(), config.metricsDir);
  fs.mkdirSync(metricsDir, { recursive: true });
  const month = new Date().toISOString().substring(0, 7);
  const outputPath = path.join(metricsDir, `${month}.md`);
  fs.writeFileSync(outputPath, report);

  console.log(`✅ Metrics report saved to ${outputPath}`);

  if (weeklyStats.length > 0) {
    const last = weeklyStats[weeklyStats.length - 1];
    console.log(
      `\nLatest (${last.weekLabel}): issues=${last.totalIssues}, score=${last.severityScore}, new_fp=${last.newFingerprints}, recurring=${last.recurringFingerprints}`
    );
  }
};
