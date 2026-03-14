"use strict";

import dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

export interface WorkspaceConfig {
  /** AI 模型名称 */
  modelName: string;
  /** AI API 地址 */
  apiBaseUrl: string;
  /** SiliconFlow API Key，优先使用环境变量 LLM_API_KEY */
  apiKey?: string;
  /** code-review 输出目录，相对于 cwd */
  codeReviewDir: string;
  /** patterns 输出目录，相对于 cwd */
  patternsDir: string;
  /** metrics 输出目录，相对于 cwd */
  metricsDir: string;
  /** Cursor rules 目录，相对于 cwd */
  rulesDir: string;
  /** rule-proposals 输出目录，相对于 cwd */
  proposalsDir: string;
  /** 额外的审查 prompt 内容，会追加到默认 prompt 中 */
  reviewPromptExtra?: string;
  /** 业务代码文件匹配模式 */
  businessCodeFilePatterns?: ReadonlyArray<RegExp>;
  /** 项目配置文件匹配模式 */
  projectConfigFilePatterns?: ReadonlyArray<RegExp>;
}

const DEFAULT_CONFIG: WorkspaceConfig = {
  modelName: "Pro/zai-org/GLM-5",
  apiBaseUrl: "https://api.siliconflow.cn/v1/chat/completions",
  codeReviewDir: "agents-workspace/code-review",
  patternsDir: "agents-workspace/patterns",
  metricsDir: "agents-workspace/metrics",
  rulesDir: ".cursor/rules",
  proposalsDir: ".cursor/rule-proposals",
};

let cachedConfig: WorkspaceConfig | null = null;
let envLoaded = false;

/**
 * 加载项目根目录的 .env 文件，支持 process.env 引用
 * @description 仅加载一次；优先保留已存在的环境变量
 */
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

/**
 * 从项目根目录加载 workspace.config.js 或 workspace.config.ts 配置文件
 * @description 支持 CommonJS 格式的 module.exports = { ... }，与默认配置合并
 * @returns 合并后的配置对象（用户配置 > 默认配置）
 */
export const loadWorkspaceConfig = (): WorkspaceConfig => {
  loadProjectEnv();

  const cwd = process.cwd();
  const candidates = ["workspace.config.js", "workspace.config.ts"];

  for (const filename of candidates) {
    const filePath = path.resolve(cwd, filename);
    if (fs.existsSync(filePath)) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const userConfig = require(filePath) as Partial<WorkspaceConfig> & { default?: Partial<WorkspaceConfig> };
        const resolved: Partial<WorkspaceConfig> = userConfig.default ?? userConfig;
        console.log(`📦 Loaded workspace config from ${filename}`);
        return { ...DEFAULT_CONFIG, ...resolved };
      } catch (err) {
        console.warn(`⚠️ Failed to load ${filename}: ${(err as Error).message}`);
      }
    }
  }

  return { ...DEFAULT_CONFIG };
};

/**
 * 获取当前生效的 workspace 配置（带缓存）
 * @returns WorkspaceConfig 对象
 */
export const getConfig = (): WorkspaceConfig => {
  if (!cachedConfig) {
    cachedConfig = loadWorkspaceConfig();
  }
  return cachedConfig;
};

/**
 * 清除配置缓存（用于测试或重新加载场景）
 */
export const resetConfigCache = (): void => {
  cachedConfig = null;
  envLoaded = false;
};
