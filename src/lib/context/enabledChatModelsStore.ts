import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProviderModel } from "../api/rust/providerModels";
import type { ProviderId } from "../api/rust/types";
import { toLocalModelId, toProviderModelId } from "../provider/modelIds";

interface EnabledChatModelsStore {
  enabled: string[];
  providerLabels: Record<string, string>;
  isEnabled: (modelId: string) => boolean;
  setEnabled: (modelId: string, on: boolean) => void;
  toggle: (modelId: string) => void;
  syncProviderLabels: (provider: ProviderId, models: ProviderModel[]) => void;
  syncLocalLabels: (models: { name: string; displayName: string }[]) => void;
  getLabel: (modelId: string) => string | undefined;
}

export const useEnabledChatModelsStore = create<EnabledChatModelsStore>()(
  persist(
    (set, get) => ({
      enabled: [],
      providerLabels: {},
      isEnabled: (modelId) => get().enabled.includes(modelId),
      setEnabled: (modelId, on) =>
        set((state) => ({
          enabled: on
            ? state.enabled.includes(modelId)
              ? state.enabled
              : [...state.enabled, modelId]
            : state.enabled.filter((m) => m !== modelId),
        })),
      toggle: (modelId) => {
        const on = !get().isEnabled(modelId);
        get().setEnabled(modelId, on);
      },
      syncProviderLabels: (provider, models) =>
        set((state) => {
          const next = { ...state.providerLabels };
          for (const model of models) {
            next[toProviderModelId(provider, model.id)] = model.name;
          }
          return { providerLabels: next };
        }),
      syncLocalLabels: (models) =>
        set((state) => {
          const next = { ...state.providerLabels };
          for (const model of models) {
            next[toLocalModelId(model.name)] = model.displayName;
          }
          return { providerLabels: next };
        }),
      getLabel: (modelId) => get().providerLabels[modelId],
    }),
    {
      name: "kathagpt-enabled-chat-models",
      version: 2,
      migrate: (persisted) => {
        const state = persisted as {
          enabled?: string[];
          openrouterLabels?: Record<string, string>;
          providerLabels?: Record<string, string>;
        };
        return {
          enabled: state.enabled ?? [],
          providerLabels:
            state.providerLabels ?? state.openrouterLabels ?? {},
        };
      },
    },
  ),
);
