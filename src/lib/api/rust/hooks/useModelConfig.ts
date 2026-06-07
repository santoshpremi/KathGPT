import type { LlmName } from "@backend/ai/llmMeta";
import { useQuery } from "@tanstack/react-query";
import { getAvailableModels, getEnabledModels } from "../modelConfig";

export function useAvailableModels() {
  return useQuery({
    queryKey: ["model-config", "available"],
    queryFn: getAvailableModels,
  });
}

export function useEnabledModels() {
  return useQuery({
    queryKey: ["model-config", "enabled"],
    queryFn: async () => (await getEnabledModels()) as LlmName[],
  });
}
