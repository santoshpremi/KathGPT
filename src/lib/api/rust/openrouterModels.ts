import type { ProviderModel } from "./providerModels";
import { getProviderModels } from "./providerModels";

/** @deprecated Use `ProviderModel` */
export type OpenRouterModel = ProviderModel;

/** @deprecated Use `getProviderModels("openrouter")` */
export function getOpenRouterModels(): Promise<OpenRouterModel[]> {
  return getProviderModels("openrouter");
}
