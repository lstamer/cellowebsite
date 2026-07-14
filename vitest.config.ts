import { fileURLToPath } from "node:url";

import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    // Agent worktrees under .claude/ carry stale copies of the repo
    // (including its test files); without this exclude `npm test` runs every
    // duplicate. Evals run separately via `npm run eval` (network + prod data).
    exclude: [...configDefaults.exclude, "**/.claude/**", "evals/**"],
  },
});
