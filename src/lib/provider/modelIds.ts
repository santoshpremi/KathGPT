import type { ProviderId } from "../api/rust/types";

export const DYNAMIC_PROVIDER_IDS = [
  "perplexity",
  "openai",
  "anthropic",
  "gemini",
  "openrouter",
] as const satisfies readonly ProviderId[];

export type DynamicProviderId = (typeof DYNAMIC_PROVIDER_IDS)[number];

export function toProviderModelId(
  provider: DynamicProviderId,
  slug: string,
): string {
  return `${provider}:${slug}`;
}

export function parseProviderModelId(
  id: string,
): { provider: DynamicProviderId; slug: string } | null {
  const idx = id.indexOf(":");
  if (idx <= 0) return null;
  const provider = id.slice(0, idx);
  const slug = id.slice(idx + 1);
  if (!slug || !DYNAMIC_PROVIDER_IDS.includes(provider as DynamicProviderId)) {
    return null;
  }
  return { provider: provider as DynamicProviderId, slug };
}

export function isProviderModelId(id: string): boolean {
  return parseProviderModelId(id) !== null;
}

export const LOCAL_MODEL_PREFIX = "local:" as const;

export function toLocalModelId(slug: string): string {
  return `${LOCAL_MODEL_PREFIX}${slug}`;
}

export function parseLocalModelId(
  id: string,
): { slug: string } | null {
  if (!id.startsWith(LOCAL_MODEL_PREFIX)) return null;
  const slug = id.slice(LOCAL_MODEL_PREFIX.length);
  if (!slug) return null;
  return { slug };
}

export function isLocalModelId(id: string): boolean {
  return parseLocalModelId(id) !== null;
}

/** @deprecated Use `toProviderModelId("openrouter", slug)` */
export const OPENROUTER_MODEL_PREFIX = "openrouter:" as const;

/** @deprecated Use `toProviderModelId("openrouter", slug)` */
export function toOpenRouterModelId(slug: string): string {
  return toProviderModelId("openrouter", slug);
}

/** @deprecated Use `isProviderModelId` */
export function isOpenRouterModelId(id: string): boolean {
  return id.startsWith(OPENROUTER_MODEL_PREFIX);
}
