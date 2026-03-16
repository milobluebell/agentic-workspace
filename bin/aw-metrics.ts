#!/usr/bin/env node
"use strict";

import { runMetricsReport } from "../src/metrics-report";

Promise.resolve()
  .then(() => runMetricsReport())
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(`[aw-metrics] Failed: ${message}`);
    process.exitCode = 1;
  });
