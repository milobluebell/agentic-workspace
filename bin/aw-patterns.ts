#!/usr/bin/env node
"use strict";

import { runAggregatePatterns } from "../src/aggregate-patterns";

Promise.resolve()
  .then(() => runAggregatePatterns())
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(`[aw-patterns] Failed: ${message}`);
    process.exitCode = 1;
  });
