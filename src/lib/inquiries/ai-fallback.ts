import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { APICallError, type LanguageModel } from "ai";

type OpenRouterConfig = {
  apiKey: string;
  model: string;
};

function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

function getOpenRouterConfig(modelEnvName: string): OpenRouterConfig | undefined {
  const apiKey = optionalEnv("OPENROUTER_API_KEY");
  const model = optionalEnv(modelEnvName);

  // The fallback is deliberately opt-in. A partial configuration must not turn
  // an otherwise useful AI Gateway error into a second, unrelated env error.
  if (!apiKey || !model) return undefined;

  return { apiKey, model };
}

export function hasRecoverableAIError(error: unknown): boolean {
  if (APICallError.isInstance(error)) {
    const statusCode = error.statusCode;
    return (
      statusCode === 402 ||
      statusCode === 408 ||
      statusCode === 429 ||
      (statusCode !== undefined && statusCode >= 500)
    );
  }

  // Undici and fetch surface connection, DNS, and timeout failures as
  // TypeErrors. These have no HTTP status but are exactly the outages the
  // secondary provider is intended to cover.
  return error instanceof TypeError;
}

export function getOpenRouterFallbackModel(): {
  model: LanguageModel;
  modelId: string;
} | undefined {
  const config = getOpenRouterConfig("OPENROUTER_MODEL");
  if (!config) return undefined;

  return {
    model: createOpenRouter({ apiKey: config.apiKey }).chat(config.model),
    modelId: config.model,
  };
}

export function getOpenRouterTranscriptionConfig(): OpenRouterConfig | undefined {
  return getOpenRouterConfig("OPENROUTER_TRANSCRIBE_MODEL");
}

/**
 * Preserve Vercel AI Gateway as the primary path, then make one OpenRouter
 * attempt only for provider availability and quota failures. Validation and
 * malformed-output errors must remain visible instead of being retried against
 * a second provider with the same invalid request.
 */
export async function generateTextWithOpenRouterFallback<T>(
  primaryModel: LanguageModel,
  generate: (model: LanguageModel) => Promise<T>,
): Promise<T> {
  try {
    return await generate(primaryModel);
  } catch (error) {
    if (!hasRecoverableAIError(error)) throw error;

    const fallback = getOpenRouterFallbackModel();
    if (!fallback) throw error;

    console.warn("AI Gateway request failed; retrying through OpenRouter", {
      fallbackModel: fallback.modelId,
      gatewayStatusCode: APICallError.isInstance(error)
        ? error.statusCode
        : undefined,
    });

    return generate(fallback.model);
  }
}
