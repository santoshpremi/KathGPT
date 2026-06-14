import { LLM_META, type LlmName } from "@backend/ai/llmMeta";

const LOCAL_CONTEXT_WINDOWS: Record<string, number> = {
  default: 32_768,
};

function localContextWindow(modelSlug: string): number {
  const lower = modelSlug.toLowerCase();
  if (lower.includes("1b")) return 8_192;
  if (lower.includes("3b")) return 16_384;
  return LOCAL_CONTEXT_WINDOWS.default;
}

export function getContextWindow(model: string | null | undefined): number {
  if (!model || model === "automatic") {
    return LLM_META["gpt-4o-mini"].contextWindow;
  }

  if (model.startsWith("local:")) {
    return localContextWindow(model.slice("local:".length));
  }

  if (model in LLM_META) {
    return LLM_META[model as LlmName].contextWindow;
  }

  return 128_000;
}

export function formatTokenCount(tokens: number): string {
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 10_000) {
    return `${Math.round(tokens / 1000)}k`;
  }
  return tokens.toLocaleString();
}
