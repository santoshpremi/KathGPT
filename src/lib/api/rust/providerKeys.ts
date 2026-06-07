import { rustFetch } from "./client";
import type { ProviderId, ProviderKeyStatus, TestProviderKeyResponse } from "./types";

export function getProviderKeyStatus(): Promise<ProviderKeyStatus[]> {
  return rustFetch("/provider-keys/status");
}

export function setProviderKey(
  provider: ProviderId,
  apiKey: string,
): Promise<ProviderKeyStatus> {
  return rustFetch("/provider-keys/set", {
    method: "POST",
    body: JSON.stringify({ provider, api_key: apiKey }),
  });
}

export function clearProviderKey(
  provider: ProviderId,
): Promise<ProviderKeyStatus | null> {
  return rustFetch(`/provider-keys/${provider}`, { method: "DELETE" });
}

export function testProviderConnection(input: {
  provider: ProviderId;
  apiKey?: string;
}): Promise<TestProviderKeyResponse> {
  return rustFetch("/provider-keys/test", {
    method: "POST",
    body: JSON.stringify({
      provider: input.provider,
      api_key: input.apiKey,
    }),
  });
}
