#!/usr/bin/env node
"use strict";

import { parsePromptArg, runSimpleCompletion } from "../src/simple-completion/simple-completion";

const prompt = parsePromptArg(process.argv);
if (!prompt) {
  console.error("Usage: aw-ask --prompt=\"your question here\"");
  process.exit(1);
}

runSimpleCompletion(prompt).catch((err) => {
  console.error("❌ aw-ask failed:", (err as Error).message);
  process.exit(1);
});
