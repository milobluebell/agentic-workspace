#!/usr/bin/env node
"use strict";

import { runGenerateSnipets } from "../src/snipets/generate-snipets";

runGenerateSnipets().catch((err) => {
  console.error("❌ aw-snipets failed:", (err as Error).message);
  process.exit(1);
});
