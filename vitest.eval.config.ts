import { defineConfig } from "vitest/config";

// Separate config so `npm test` stays fast and offline: evals hit Supabase and
// the AI Gateway with real credentials from .env.local.
export default defineConfig({
  test: {
    include: ["evals/**/*.eval.ts"],
    testTimeout: 300_000,
    hookTimeout: 120_000,
  },
});
