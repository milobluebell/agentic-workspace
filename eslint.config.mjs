import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "agents-workspace/**",
      "workspace.config.js",
      ".github/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts"],
    languageOptions: {
      parserOptions: {
        sourceType: "module",
      },
    },
    rules: {
      "no-console": "off",
    },
  }
);
