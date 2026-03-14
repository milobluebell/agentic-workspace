"use strict";

export type {
  IssueType,
  IssueSeverity,
  ReviewIssue,
  ReviewRecord,
  PatternEntry,
  CurrentCommitInfo,
} from "./shared";
export {
  callAI,
  getDatetimeStr,
  getISOWeekLabel,
  SEVERITY_WEIGHTS,
  TYPE_LABEL,
  SEVERITY_LABEL,
  readFileContent,
  pathExists,
  listFiles,
  readAllFiles,
  loadExistingRulesContext,
  isInitialCommit,
  getCurrentCommit,
  getCommittedFiles,
  getCommitDiff,
} from "./shared";

export type { WorkspaceConfig } from "./root-config";
export { getConfig, loadWorkspaceConfig, resetConfigCache } from "./root-config";

export { runPostCommitReview } from "./code-review/post-commit-review";
export { runAggregatePatterns } from "./aggregate-patterns";
export { runEvolveRules } from "./evolve-rules";
export { runMetricsReport } from "./metrics-report";

export { parseAIResponse } from "./code-review/ai-response";
export { shouldRunReview } from "./code-review/file-filter";
export type { ReviewExecutionDecision } from "./code-review/file-filter";
export { saveReview } from "./code-review/review-report";

export { runSimpleCompletion, parsePromptArg } from "./simple-completion/simple-completion";
