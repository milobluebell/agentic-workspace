#!/usr/bin/env node
"use strict";

import { runEvolveRules } from "../src/evolve-rules";

runEvolveRules().catch((err) => {
  console.error("❌ aw-evolve failed:", (err as Error).message);
  process.exit(1);
});
