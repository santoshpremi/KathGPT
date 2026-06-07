import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  clearProviderKey,
  getProviderKeyStatus,
  setProviderKey,
  testProviderConnection,
} from "../providerKeys";
import type { ProviderId } from "../types";

const STATUS_KEY = ["provider-keys", "status"] as const;

export function useProviderKeyStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: getProviderKeyStatus,
  });
}

export function useSetProviderKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      provider,
      apiKey,
    }: {
      provider: ProviderId;
      apiKey: string;
    }) => setProviderKey(provider, apiKey),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STATUS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["model-config"] });
    },
  });
}

export function useClearProviderKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ provider }: { provider: ProviderId }) =>
      clearProviderKey(provider),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: STATUS_KEY });
      void queryClient.invalidateQueries({ queryKey: ["model-config"] });
    },
  });
}

export function useTestProviderConnection() {
  return useMutation({
    mutationFn: testProviderConnection,
  });
}
