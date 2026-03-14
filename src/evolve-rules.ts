"use strict";

import * as fs from "fs";
import * as path from "path";
import { callAI, SEVERITY_LABEL, readAllFiles, pathExists } from "./shared";
import type { PatternEntry } from "./shared";
import { getConfig } from "./root-config";

interface PatternsSnapshot {
  generatedAt: string;
  weekLabel: string;
  totalCommits: number;
  recurring: PatternEntry[];
  emerging: PatternEntry[];
}

/**
 * 读取最新的 patterns JSON 快照
 * @returns 最新快照数据，若不存在则返回 null
 */
const loadLatestPatterns = (): PatternsSnapshot | null => {
  const config = getConfig();
  const patternsDir = path.resolve(process.cwd(), config.patternsDir);
  const files = readAllFiles(patternsDir, ".json");
  if (files.length === 0) return null;
  const latest = files[files.length - 1];
  return JSON.parse(latest.content) as PatternsSnapshot;
};

/**
 * 读取所有现有规则文件内容，拼接为上下文字符串
 * @returns 规则内容字符串
 */
const loadExistingRules = (): string => {
  const config = getConfig();
  const rulesDir = path.resolve(process.cwd(), config.rulesDir);
  if (!pathExists(rulesDir)) return "（无规则文件）";
  const files = readAllFiles(rulesDir, ".mdc");
  if (files.length === 0) return "（无规则文件）";
  return files
    .map((f) => `### ${f.filename}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");
};

/**
 * 构建规则演化 prompt
 * @param snapshot Pattern 快照
 * @param existingRules 现有规则文本
 * @returns 完整 prompt
 */
const buildEvolvePrompt = (snapshot: PatternsSnapshot, existingRules: string): string => {
  const recurringList =
    snapshot.recurring.length > 0
      ? snapshot.recurring
          .map(
            (p) =>
              `- [出现 ${p.occurrences} 次] ${p.title} | fingerprint: \`${p.fingerprint}\` | 严重度: ${SEVERITY_LABEL[p.maxSeverity]}`
          )
          .join("\n")
      : "（无）";

  const emergingList =
    snapshot.emerging.length > 0
      ? snapshot.emerging
          .map((p) => `- [出现 ${p.occurrences} 次] ${p.title} | fingerprint: \`${p.fingerprint}\``)
          .join("\n")
      : "（无）";

  return `
你是一位代码规范专家，负责维护一套 Cursor Rules（给 AI Coding Agent 使用的编码规范）。

请根据以下代码审查中反复出现的问题，对现有规则提出具体的新增或修改建议。

## 重复 Anti-Patterns（3+ 次，必须重点关注）
${recurringList}

## 新兴问题（1-2 次，酌情关注）
${emergingList}

## 现有规则内容
${existingRules}

---

请输出规则演化建议，严格使用以下 Markdown 格式：

# Rule Evolution Proposal
> 基于 ${snapshot.weekLabel} pattern 分析 | 累计 ${snapshot.totalCommits} commits

## 📌 建议新增的规则

### 建议新增到 [目标文件名.mdc]

\`\`\`
[规则的具体内容，要求精简、可被 AI 直接执行，不超过 10 行]
\`\`\`

**理由**: 基于 fingerprint \`xxx\`，出现 N 次，现有规则未覆盖此场景

---

## ✏️ 建议修改的现有规则

### 修改 [目标文件名.mdc]

**现有表述**: 原规则中的具体内容

**建议改为**: 更精确/更强约束的表述

**理由**: 现有表述不够明确，导致 fingerprint \`xxx\` 问题反复出现

---

注意：
- 如果某问题已被现有规则覆盖但仍然反复出现，说明规则表述需要强化，请在修改建议中处理
- 规则内容必须简洁，写给 AI 看，不是给人看的文档
- 只针对有数据支撑的 fingerprint 提建议，不要臆测
- 若无需新增也无需修改，明确说明原因
`.trim();
};

/**
 * 执行规则演化建议主流程
 * @description 基于 pattern 分析结果 + 现有规则，让 AI 生成规则新增/修改建议
 */
export const runEvolveRules = async (): Promise<void> => {
  console.log("🧠 Generating rule evolution proposals...");

  const snapshot = loadLatestPatterns();
  if (!snapshot) {
    console.log("ℹ️ No pattern data found. Run `aw-patterns` first.");
    process.exit(0);
  }

  if (snapshot.recurring.length === 0 && snapshot.emerging.length === 0) {
    console.log("ℹ️ No patterns to analyze. Nothing to propose.");
    process.exit(0);
  }

  const existingRules = loadExistingRules();
  const prompt = buildEvolvePrompt(snapshot, existingRules);

  console.log(
    `📊 Analyzing ${snapshot.recurring.length} recurring + ${snapshot.emerging.length} emerging patterns...`
  );

  const proposal = await callAI(prompt, true);

  const config = getConfig();
  const proposalsDir = path.resolve(process.cwd(), config.proposalsDir);
  fs.mkdirSync(proposalsDir, { recursive: true });
  const timestamp = new Date().toISOString().split("T")[0];
  const outputPath = path.join(proposalsDir, `${timestamp}.md`);
  fs.writeFileSync(outputPath, proposal);

  console.log(`\n✅ Rule proposal saved to ${outputPath}`);
  console.log(`\n📋 Next steps:`);
  console.log(`   1. Open ${outputPath} to review the proposals`);
  console.log(`   2. Copy rules you agree with into .cursor/rules/*.mdc`);
};
