module.exports = {
  modelName: "Pro/zai-org/GLM-5",
  apiKey: process.env.LLM_API_KEY,
  apiBaseUrl: "https://api.siliconflow.cn/v1/chat/completions",
  codeReviewDir: "agents-workspace/code-review",
  patternsDir: "agents-workspace/patterns",
  metricsDir: "agents-workspace/metrics",
  rulesDir: ".cursor/rules",
  proposalsDir: ".cursor/rule-proposals",
};
