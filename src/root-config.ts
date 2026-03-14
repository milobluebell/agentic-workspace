"use strict";

import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

export interface WorkspaceConfig {
  modelName: string;
  apiBaseUrl: string;
  apiKey?: string;
  codeReviewDir: string;
  patternsDir: string;
  metricsDir: string;
  rulesDir: string;
  proposalsDir: string;
  reviewPromptExtra?: string;
  businessCodeFilePatterns: ReadonlyArray<RegExp>;
  projectConfigFilePatterns: ReadonlyArray<RegExp>;
  postCommitReviewMaxRuntimeMs: number;
}

let cachedConfig: WorkspaceConfig | null = null;
let envLoaded = false;

const DEFAULT_CONFIG: WorkspaceConfig = {
  modelName: "Pro/zai-org/GLM-5",
  apiBaseUrl: "https://api.siliconflow.cn/v1/chat/completions",
  codeReviewDir: "agents-workspace/code-review",
  patternsDir: "agents-workspace/patterns",
  metricsDir: "agents-workspace/metrics",
  rulesDir: ".cursor/rules",
  proposalsDir: ".cursor/rule-proposals",
  businessCodeFilePatterns: [/\.(?:ts|tsx|js|jsx|json)$/i],
  projectConfigFilePatterns: [
    /(^|\/)package\.json$/i,
    /(^|\/)pnpm-(?:lock|workspace)\.yaml$/i,
    /(^|\/)tsconfig(?:\..+)?\.json$/i,
    /(^|\/)(?:Dockerfile|docker-compose(?:\..+)?\.ya?ml)$/i,
    /(^|\/)\.env(?:\.[^/.]+)?(?:\.example)?$/i,
    /(^|\/)\.npmrc$/i,
    /(^|\/)(?:\.eslintrc(?:\..+)?|eslint\.config\.(?:js|cjs|mjs|ts))$/i,
    /(^|\/)(?:\.prettierrc(?:\..+)?|prettier\.config\.(?:js|cjs|mjs|ts))$/i,
  ],
  postCommitReviewMaxRuntimeMs: 20 * 60 * 1000,
};

const loadProjectEnv = (): void => {
  if (envLoaded) return;
  const cwd = process.cwd();
  const envFiles = [".env", ".env.local"];
  for (const filename of envFiles) {
    const envPath = path.resolve(cwd, filename);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath, override: false });
    }
  }
  envLoaded = true;
};

export const loadWorkspaceConfig = (): WorkspaceConfig => {
  loadProjectEnv();

  const cwd = process.cwd();
  const candidates = ["workspace.config.js", "workspace.config.ts"];

  for (const filename of candidates) {
    const filePath = path.resolve(cwd, filename);
    if (!fs.existsSync(filePath)) continue;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const userConfig = require(filePath) as Partial<WorkspaceConfig> & { default?: Partial<WorkspaceConfig> };
      const resolved = (userConfig.default ?? userConfig) as Partial<WorkspaceConfig>;
      console.log(`📦 Loaded workspace config from ${filename}`);
      return { ...DEFAULT_CONFIG, ...resolved };
    } catch (err) {
      console.warn(`⚠️ Failed to load ${filename}: ${(err as Error).message}`);
    }
  }

  throw new Error("workspace.config.js is required in project root");
};

export const getConfig = (): WorkspaceConfig => {
  if (!cachedConfig) {
    cachedConfig = loadWorkspaceConfig();
  }
  return cachedConfig;
};

export const resetConfigCache = (): void => {
  cachedConfig = null;
  envLoaded = false;
};
