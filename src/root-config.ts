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
  businessCodeFilePatterns?: ReadonlyArray<RegExp>;
  projectConfigFilePatterns?: ReadonlyArray<RegExp>;
  postCommitReviewMaxRuntimeMs?: number;
}

let cachedConfig: WorkspaceConfig | null = null;
let envLoaded = false;

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
      const resolved = (userConfig.default ?? userConfig) as WorkspaceConfig;
      console.log(`📦 Loaded workspace config from ${filename}`);
      return resolved;
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
