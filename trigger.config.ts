import { defineConfig } from "@trigger.dev/sdk";

const project = process.env.TRIGGER_PROJECT_REF;

if (!project) {
  throw new Error("TRIGGER_PROJECT_REF is required to load Trigger.dev config");
}

export default defineConfig({
  project,
  dirs: ["./trigger"],
  // supabase-js needs native WebSocket, which requires Node 22+. The default
  // Trigger.dev runtime is older and fails at Supabase client construction.
  runtime: "node-22",
  machine: "small-1x",
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1_000,
      maxTimeoutInMs: 15_000,
      randomize: true,
    },
  },
});
