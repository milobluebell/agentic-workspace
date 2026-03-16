"use strict";

import * as fs from "fs";
import * as path from "path";
import { callAI, getCommitDiff, getCommittedFiles, loadExistingRulesContext } from "../shared";
import { getConfig } from "../root-config";

type SnipetCategory = "components" | "utils";

interface SnipetItem {
  name: string;
  category: SnipetCategory;
  purpose: string;
  code: string;
  language: string;
}

interface SnipetResponse {
  snipets: SnipetItem[];
}

interface SnipetDocEntry {
  name: string;
  purpose: string;
  filePath: string;
}

const SNIPETS_ROOT = "agents-workspace/snipets";
const CATEGORY_DIRS: ReadonlyArray<SnipetCategory> = ["components", "utils"];
const NAME_PATTERN = /^[a-z][A-Za-z0-9]*$/;
const SNIPETS_INDEX_PATH = `${SNIPETS_ROOT}/index.md`;
const MAX_INDEX_CONTEXT_CHARS = 60000;

const isBusinessCodeFile = (filePath: string): boolean => {
  const patterns = getConfig().businessCodeFilePatterns;
  return patterns.some((pattern) => pattern.test(filePath));
};

const extractJsonPayload = (content: string): string => {
  const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonBlockMatch?.[1]) return jsonBlockMatch[1].trim();
  const rawJsonMatch = content.match(/(\{[\s\S]*\})/);
  if (rawJsonMatch?.[1]) return rawJsonMatch[1].trim();
  return content.trim();
};

const isValidSnipetCategory = (value: string): value is SnipetCategory =>
  CATEGORY_DIRS.includes(value as SnipetCategory);

const sanitizeSnipetName = (name: string): string => {
  const trimmed = name.trim();
  const cleaned = trimmed.replace(/[^A-Za-z0-9]/g, "");
  if (!cleaned) return "";
  return cleaned.charAt(0).toLowerCase() + cleaned.slice(1);
};

const parseSnipetResponse = (content: string): SnipetItem[] => {
  const parsed = JSON.parse(extractJsonPayload(content)) as Partial<SnipetResponse>;
  const rawItems = Array.isArray(parsed.snipets) ? parsed.snipets : [];
  return rawItems
    .map((item) => {
      const name = sanitizeSnipetName(String(item.name ?? ""));
      const category = String(item.category ?? "").trim().toLowerCase();
      const purpose = String(item.purpose ?? "").trim();
      const code = String(item.code ?? "").trim();
      const language = String(item.language ?? "").trim().toLowerCase();
      if (!name || !NAME_PATTERN.test(name) || !isValidSnipetCategory(category) || !purpose || !code) {
        return null;
      }
      return {
        name,
        category,
        purpose,
        code,
        language: language || "ts",
      };
    })
    .filter((item): item is SnipetItem => item !== null);
};

const buildSnipetPrompt = (
  diff: string,
  existingNames: ReadonlyArray<string>,
  rulesContext: string,
  indexContent: string
): string => {
  const existingNamesText = existingNames.length > 0 ? existingNames.map((name) => `- ${name}`).join("\n") : "（无）";
  return `
你是一位资深 TypeScript 工程师。
任务：从以下“当前 commit 的业务相关代码 diff”中，抽象出可复用的工具函数或组件函数，形成可沉淀的函数库。

要求：
1. 仅输出可复用的函数，不要输出类。
2. 函数名必须是首字母小写的 camelCase。
3. category 只能是 "components" 或 "utils"。
4. 每个函数要给出简短 purpose（说明作用和使用场景）。
5. code 只放函数代码，不要包含 markdown、解释文字、文件路径。
6. 避免与已有函数重名。
7. 输出数量控制在 2-8 个，优先高复用价值。

已存在的函数名：
${existingNamesText}

当前 snipets index.md（用于避免语义重复）：
\`\`\`md
${indexContent}
\`\`\`

项目规范上下文：
${rulesContext}

当前 commit 的业务代码 diff：
\`\`\`diff
${diff}
\`\`\`

请严格返回 JSON（不要返回任何其他文本）：
{
  "snipets": [
    {
      "name": "camelCaseName",
      "category": "components | utils",
      "purpose": "一句话描述该函数用途",
      "language": "ts",
      "code": "export const camelCaseName = (...) => { ... }"
    }
  ]
}
`.trim();
};

const ensureSnipetsDirs = (rootDir: string): void => {
  fs.mkdirSync(path.join(rootDir, "components"), { recursive: true });
  fs.mkdirSync(path.join(rootDir, "utils"), { recursive: true });
};

const formatSnipetMarkdown = (item: SnipetItem): string =>
  [
    `# ${item.name}`,
    "",
    `> ${item.purpose}`,
    "",
    `\`\`\`${item.language || "ts"}`,
    item.code.trim(),
    "```",
    "",
  ].join("\n");

const collectExistingSnipetNames = (rootDir: string): string[] => {
  const names = new Set<string>();
  for (const category of CATEGORY_DIRS) {
    const dir = path.join(rootDir, category);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir);
    for (const filename of files) {
      if (!filename.endsWith(".md")) continue;
      names.add(filename.replace(/\.md$/i, ""));
    }
  }
  return [...names].sort();
};

const writeSnipetFiles = (rootDir: string, items: ReadonlyArray<SnipetItem>): SnipetItem[] => {
  const written: SnipetItem[] = [];
  for (const item of items) {
    const filePath = path.join(rootDir, item.category, `${item.name}.md`);
    fs.writeFileSync(filePath, formatSnipetMarkdown(item), "utf-8");
    written.push(item);
  }
  return written;
};

const readSnipetDocEntries = (rootDir: string): Record<SnipetCategory, SnipetDocEntry[]> => {
  const result: Record<SnipetCategory, SnipetDocEntry[]> = {
    components: [],
    utils: [],
  };
  for (const category of CATEGORY_DIRS) {
    const dir = path.join(rootDir, category);
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((filename) => filename.endsWith(".md")).sort();
    for (const filename of files) {
      const absolutePath = path.join(dir, filename);
      const content = fs.readFileSync(absolutePath, "utf-8");
      const name = filename.replace(/\.md$/i, "");
      const purposeMatch = content.match(/^>\s+(.+)$/m);
      result[category].push({
        name,
        purpose: purposeMatch?.[1]?.trim() || "暂无描述",
        filePath: `${category}/${filename}`,
      });
    }
  }
  return result;
};

const buildIndexMarkdown = (entries: Record<SnipetCategory, SnipetDocEntry[]>): string => {
  const lines: string[] = [];
  lines.push("# Snipets Index");
  lines.push("");
  lines.push(`- Generated at: ${new Date().toISOString()}`);
  lines.push("");
  for (const category of CATEGORY_DIRS) {
    lines.push(`## ${category}`);
    lines.push("");
    if (entries[category].length === 0) {
      lines.push("> 暂无内容");
      lines.push("");
      continue;
    }
    lines.push("| Name | Purpose | File |");
    lines.push("| --- | --- | --- |");
    for (const entry of entries[category]) {
      lines.push(`| \`${entry.name}\` | ${entry.purpose} | \`${entry.filePath}\` |`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd() + "\n";
};

const updateSnipetsIndex = (rootDir: string): void => {
  const entries = readSnipetDocEntries(rootDir);
  const indexPath = path.join(rootDir, "index.md");
  fs.writeFileSync(indexPath, buildIndexMarkdown(entries), "utf-8");
};

const readIndexPromptContext = (rootDir: string): string => {
  const indexPath = path.join(rootDir, "index.md");
  if (!fs.existsSync(indexPath)) return "（index.md 不存在）";
  const content = fs.readFileSync(indexPath, "utf-8").trim();
  if (!content) return "（index.md 为空）";
  return content.length > MAX_INDEX_CONTEXT_CHARS
    ? `${content.slice(0, MAX_INDEX_CONTEXT_CHARS)}\n\n<!-- truncated -->`
    : content;
};

const logRunSummary = (
  analyzedFiles: ReadonlyArray<string>,
  generatedFiles: ReadonlyArray<string>,
  status: string
): void => {
  console.log("\n📦 aw-snipets summary");
  console.log(`- status: ${status}`);
  if (analyzedFiles.length === 0) {
    console.log("- analyzed files: (none)");
  } else {
    console.log("- analyzed files:");
    for (const file of analyzedFiles) {
      console.log(`  - ${file}`);
    }
  }
  if (generatedFiles.length === 0) {
    console.log("- generated files: (none)");
  } else {
    console.log("- generated files:");
    for (const file of generatedFiles) {
      console.log(`  - ${file}`);
    }
  }
};

export const runGenerateSnipets = async (): Promise<void> => {
  console.log("🧩 Generating commit-based snipets...");
  const committedFiles = getCommittedFiles();
  const businessFiles = committedFiles.filter(isBusinessCodeFile);
  if (businessFiles.length === 0) {
    console.log("ℹ️ No business code files found in current commit.");
    logRunSummary([], [], "skipped: no business code files in commit");
    return;
  }
  const diff = getCommitDiff(businessFiles);
  if (!diff.trim()) {
    console.log("ℹ️ No business diff found in current commit.");
    logRunSummary(businessFiles, [], "skipped: business diff is empty");
    return;
  }
  const snipetsRoot = path.resolve(process.cwd(), SNIPETS_ROOT);
  ensureSnipetsDirs(snipetsRoot);
  const existingNames = collectExistingSnipetNames(snipetsRoot);
  const rulesContext = loadExistingRulesContext();
  const indexContent = readIndexPromptContext(snipetsRoot);
  const prompt = buildSnipetPrompt(diff, existingNames, rulesContext, indexContent);
  const aiResponse = await callAI(prompt, true);
  const parsedItems = parseSnipetResponse(aiResponse);
  if (parsedItems.length === 0) {
    console.log("ℹ️ LLM returned no valid snipets.");
    logRunSummary(businessFiles, [], "completed: no valid snippets returned");
    return;
  }
  const deduplicated = parsedItems.filter((item, index, arr) => arr.findIndex((v) => v.name === item.name) === index);
  const newItems = deduplicated.filter((item) => !existingNames.includes(item.name));
  if (newItems.length === 0) {
    console.log("ℹ️ No new snipets generated (all names already exist).");
    updateSnipetsIndex(snipetsRoot);
    logRunSummary(businessFiles, [SNIPETS_INDEX_PATH], "completed: no new snippets, index refreshed");
    return;
  }
  const written = writeSnipetFiles(snipetsRoot, newItems);
  updateSnipetsIndex(snipetsRoot);
  const generatedFiles = [...written.map((item) => `${SNIPETS_ROOT}/${item.category}/${item.name}.md`), SNIPETS_INDEX_PATH];
  console.log(`✅ Generated ${written.length} snipets into ${SNIPETS_ROOT}`);
  console.log(`📚 Updated ${SNIPETS_ROOT}/index.md`);
  logRunSummary(businessFiles, generatedFiles, "completed: snippets generated");
};
