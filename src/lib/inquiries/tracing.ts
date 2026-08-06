// LangSmith tracing for the WhatsApp inquiry agent.
//
// Every analysis run (extraction -> knowledge retrieval -> drafting) is sent to
// LangSmith as one trace so drafts can be inspected, annotated, and turned into
// datasets. Tracing is entirely opt-in: without LANGSMITH_TRACING=true and an
// API key every export here is a no-op passthrough, and a LangSmith failure can
// never break the reply pipeline.

import type { Telemetry, TelemetryOptions } from "ai";
import { Client } from "langsmith";
import { LangSmithTelemetry } from "langsmith/experimental/vercel";
import { traceable } from "langsmith/traceable";

const DEFAULT_PROJECT = "stamer-inquiry-agent";

let cachedClient: Client | null = null;

export function isTracingEnabled(): boolean {
  return (
    process.env.LANGSMITH_TRACING?.trim() === "true" &&
    Boolean(process.env.LANGSMITH_API_KEY?.trim())
  );
}

function projectName(): string {
  return process.env.LANGSMITH_PROJECT?.trim() || DEFAULT_PROJECT;
}

// A single shared client so all runs in a process batch onto one queue, which
// is what flushTraces() drains before a serverless/Trigger.dev run exits.
function getClient(): Client | null {
  if (!isTracingEnabled()) return null;

  if (!cachedClient) {
    cachedClient = new Client({
      apiKey: process.env.LANGSMITH_API_KEY?.trim(),
      apiUrl: process.env.LANGSMITH_ENDPOINT?.trim() || undefined,
    });
  }

  return cachedClient;
}

/**
 * Telemetry to hand to a single `generateText` call. Returns `undefined` when
 * tracing is off, which the AI SDK treats as "no telemetry".
 *
 * `instructions` should be the same string passed to the call's `instructions`
 * option. The AI SDK sends it outside the messages array and LangSmith records
 * only that array, so it is re-attached here as a leading system message.
 * Without it a trace shows the enquiry but not the rules, business knowledge,
 * or examples the model actually answered with — which is most of the tokens.
 */
export function inquiryTelemetry(
  name: string,
  instructions?: string,
): TelemetryOptions | undefined {
  const client = getClient();
  if (!client) return undefined;

  return {
    integrations: [
      LangSmithTelemetry({
        client,
        name,
        projectName: projectName(),
        ...(instructions
          ? {
              processChildLLMRunInputs: (inputs) => ({
                ...inputs,
                messages: [
                  { role: "system", content: instructions },
                  ...(Array.isArray(inputs.messages) ? inputs.messages : []),
                ],
              }),
            }
          : {}),
      }) as Telemetry,
    ],
  };
}

/**
 * Wraps one end-to-end agent run so the extraction and drafting calls nest
 * under a single parent trace. `conversation_id` metadata groups every run for
 * a contact into a LangSmith thread.
 */
export async function traceInquiryRun<T>(
  input: {
    name: string;
    /** LangSmith run type. "chain" by default; "retriever" for lookups. */
    runType?: string;
    conversationId?: string;
    metadata?: Record<string, unknown>;
    inputs?: Record<string, unknown>;
    /**
     * Shapes what LangSmith logs as the run's output. Supply chat-shaped
     * `{ messages: [...] }` so the Threads view can render the exchange;
     * without it LangSmith receives the raw return value and has no message
     * to display.
     */
    outputs?: (result: T) => Record<string, unknown>;
  },
  run: () => Promise<T>,
): Promise<T> {
  const client = getClient();
  if (!client) return run();

  // processOutputs receives LangSmith's serialised output rather than T, so
  // the typed result is captured here and formatted from the closure. Each
  // call gets its own closure, so concurrent runs cannot cross over.
  let result: T | undefined;

  const wrapped = traceable(
    async () => {
      result = await run();
      return result;
    },
    {
      name: input.name,
      client,
      project_name: projectName(),
      run_type: input.runType ?? "chain",
      metadata: {
        ...input.metadata,
        ...(input.conversationId
          ? { conversation_id: input.conversationId }
          : {}),
      },
      // traceable derives inputs from the wrapped function's arguments; `run`
      // takes none, so the interesting inputs are supplied explicitly.
      processInputs: () => input.inputs ?? {},
      processOutputs: (raw) =>
        input.outputs && result !== undefined ? input.outputs(result) : raw,
    },
  );

  return wrapped();
}

/**
 * Drains queued traces. Must be awaited before a short-lived process (a
 * Trigger.dev run, a Vercel function) exits, or traces are silently lost.
 * Never throws: a tracing failure must not fail the run that produced it.
 */
export async function flushInquiryTraces(): Promise<void> {
  if (!cachedClient) return;

  try {
    await cachedClient.awaitPendingTraceBatches();
  } catch (error) {
    console.warn(
      "LangSmith trace flush failed",
      error instanceof Error ? error.message : error,
    );
  }
}
