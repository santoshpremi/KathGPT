import type { ProviderId } from "../types";
import { useProviderModels } from "./useProviderModels";

/** @deprecated Use `useProviderModels("openrouter", enabled)` */
export function useOpenRouterModels(enabled: boolean) {
  return useProviderModels("openrouter" satisfies ProviderId, enabled);
}
