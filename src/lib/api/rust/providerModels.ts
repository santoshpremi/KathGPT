import type { ProviderId } from "./types";
import { rustFetch } from "./client";

export interface ProviderModel {
  id: string;
  name: string;
  description: string;
  contextLength?: number;
}

export function getProviderModels(
  provider: ProviderId,
): Promise<ProviderModel[]> {
  return rustFetch(`/model-config/provider-models/${provider}`);
}
