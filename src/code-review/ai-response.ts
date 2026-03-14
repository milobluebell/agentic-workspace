"use strict";

import type { ReviewIssue } from "../shared";

/**
 * 解析 AI 返回的 JSON 响应，提取 ReviewIssue 列表
 * @param content AI 原始响应文本
 * @returns 解析后的 ReviewIssue 数组
 */
export const parseAIResponse = (content: string): ReviewIssue[] => {
  const jsonBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  const rawJsonMatch = content.match(/(\{[\s\S]*\})/);
  const jsonStr = jsonBlockMatch
    ? jsonBlockMatch[1].trim()
    : rawJsonMatch
      ? rawJsonMatch[1].trim()
      : content.trim();
  const parsed = JSON.parse(jsonStr) as { issues: ReviewIssue[] };
  return parsed.issues ?? [];
};
