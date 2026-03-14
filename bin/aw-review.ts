#!/usr/bin/env node
"use strict";

import { runPostCommitReview } from "../src/code-review/post-commit-review";

runPostCommitReview().catch((err) => {
  console.error("❌ aw-review failed:", (err as Error).message);
  process.exit(1);
});
