import { useQuery } from "@tanstack/react-query";
import type { ProviderId } from "../types";
import { getProviderModels } from "../providerModels";

export function useProviderModels(provider: ProviderId, enabled: boolean) {
  return useQuery({
    queryKey: ["model-config", "provider-models", provider],
    queryFn: () => getProviderModels(provider),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}
