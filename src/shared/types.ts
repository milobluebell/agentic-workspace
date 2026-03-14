"use strict";

export type IssueType =
  | "security"
  | "architecture"
  | "performance"
  | "code-style"
  | "maintainability"
  | "memory-leak"
  | "boundary";

export type IssueSeverity = "critical" | "high" | "medium" | "low";

export interface ReviewIssue {
  type: IssueType;
  title: string;
  description: string;
  severity: IssueSeverity;
  file: string | null;
  /** 语义化短标识，kebab-case，用于跨 commit 识别同类问题复发 */
  fingerprint: string;
}

export interface ReviewRecord {
  schemaVersion: "1";
  commitHash: string;
  commitMessage: string;
  timestamp: string;
  issues: ReviewIssue[];
}

export interface PatternEntry {
  fingerprint: string;
  title: string;
  type: IssueType;
  maxSeverity: IssueSeverity;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  commits: string[];
}

export interface CurrentCommitInfo {
  commitMessage: string;
  commitHash: string;
}
