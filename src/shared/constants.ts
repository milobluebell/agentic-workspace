"use strict";

import type { IssueSeverity, IssueType } from "./types";

/** 严重程度权重，用于计算 Severity Weighted Score */
export const SEVERITY_WEIGHTS: Record<IssueSeverity, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export const TYPE_LABEL: Record<IssueType, string> = {
  security: "安全漏洞",
  architecture: "架构设计",
  performance: "性能瓶颈",
  "code-style": "代码规范",
  maintainability: "可维护性",
  "memory-leak": "内存泄漏",
  boundary: "边界情况",
};

export const SEVERITY_LABEL: Record<IssueSeverity, string> = {
  critical: "🔴 严重",
  high: "🟠 高",
  medium: "🟡 中",
  low: "🟢 低",
};
