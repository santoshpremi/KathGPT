import { Add, Check, KeyboardArrowDown } from "@mui/icons-material";
import {
  Box,
  Dropdown,
  Menu,
  MenuButton,
  MenuItem,
  Typography,
} from "@mui/joy";
import { useMemo } from "react";
import type { TFunction } from "i18next";
import type { ModelOverride } from "@backend/api/chat/chatTypes";
import type { LlmName } from "@backend/ai/llmMeta";
import { LLM_META } from "@backend/ai/llmMeta";
import type { ModelProviderGroup } from "@backend/ai/modelProviderGroups";
import {
  useLocalModelsStatus,
  useProviderKeyStatus,
} from "../../../lib/api/rust";
import type { ProviderId } from "../../../lib/api/rust/types";
import { useEnabledChatModelsStore } from "../../../lib/context/enabledChatModelsStore";
import {
  DYNAMIC_PROVIDER_IDS,
  isLocalModelId,
  isProviderModelId,
  parseLocalModelId,
  parseProviderModelId,
} from "../../../lib/provider/modelIds";
import { useTranslation } from "../../../lib/i18n";
import { useModals } from "../../../router";

export type SelectableModelId = ModelOverride | string;

const PROVIDER_GROUP_LABELS: Record<ProviderId, string> = {
  perplexity: "apiKeysModal.providers.perplexity.name",
  openai: "apiKeysModal.providers.openai.name",
  anthropic: "apiKeysModal.providers.anthropic.name",
  gemini: "apiKeysModal.providers.gemini.name",
  openrouter: "apiKeysModal.providers.openrouter.name",
};

const sectionHeaderSx = {
  px: 1.5,
  pt: 1,
  pb: 0.5,
  color: "#9b9b9b",
  fontWeight: 600,
  fontSize: "0.6875rem",
  letterSpacing: "0.04em",
} as const;

const menuSx = {
  minWidth: 300,
  maxHeight: 400,
  overflowY: "auto",
  py: 0.5,
  px: 0.5,
  bgcolor: "#ffffff",
  borderRadius: "12px",
  border: "1px solid #e5e5e5",
  boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
} as const;

const triggerSx = {
  borderRadius: "999px",
  border: "1px solid #e5e5e5",
  bgcolor: "#ffffff",
  color: "#0d0d0d",
  fontWeight: 500,
  fontSize: "0.8125rem",
  px: 1.5,
  py: 0.625,
  minHeight: 32,
  fontFamily:
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  "&:hover": { bgcolor: "#f7f7f8" },
} as const;

function modelLabel(
  model: SelectableModelId,
  t: TFunction,
  getLabel: (id: string) => string | undefined,
) {
  if (model === "automatic") return t("modelMeta.automatic");
  if (isLocalModelId(model)) {
    return getLabel(model) ?? parseLocalModelId(model)?.slug ?? model;
  }
  if (isProviderModelId(model)) {
    return getLabel(model) ?? parseProviderModelId(model)?.slug ?? model;
  }
  return t(`modelMeta.${model}`, {
    defaultValue: LLM_META[model as LlmName]?.name ?? model,
  });
}

function modelTier(model: SelectableModelId, t: TFunction): string | null {
  if (model === "automatic" || isProviderModelId(model)) return null;
  const meta = LLM_META[model as LlmName];
  if (!meta) return null;
  if (meta.quality >= 5 && meta.speed <= 2) return t("modelTier.extraHigh");
  if (meta.quality >= 5) return t("modelTier.high");
  if (meta.speed >= 4) return t("modelTier.fast");
  if (meta.quality >= 3) return t("modelTier.medium");
  return null;
}

function isStoredKey(
  keyStatus: { id: ProviderId; source: string }[],
  providerId: ProviderId,
) {
  return keyStatus.find((s) => s.id === providerId)?.source === "stored";
}

function useProviderKeyState() {
  const { data: keyStatus, isPending } = useProviderKeyStatus();

  const isProviderConfigured = (provider: ProviderId) => {
    if (isPending || !keyStatus) return false;
    return isStoredKey(keyStatus, provider);
  };

  return { isProviderConfigured, keysLoaded: !isPending && !!keyStatus };
}

function ModelMenuItem({
  model,
  active,
  onSelect,
}: {
  model: SelectableModelId;
  active: SelectableModelId;
  onSelect: (model: SelectableModelId) => void;
}) {
  const { t } = useTranslation();
  const getLabel = useEnabledChatModelsStore((s) => s.getLabel);
  const selected = active === model;
  const tier = modelTier(model, t);

  return (
    <MenuItem
      selected={selected}
      onClick={() => onSelect(model)}
      sx={{
        borderRadius: "8px",
        py: 1.125,
        px: 1.5,
        minHeight: 40,
        bgcolor: "transparent",
        color: "#0d0d0d",
        fontFamily:
          'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
        "&:hover": { bgcolor: "#f3f3f3" },
        "&.Mui-selected": {
          bgcolor: "#f3f3f3",
          color: "#0d0d0d",
          "&:hover": { bgcolor: "#ececec" },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          flex: 1,
          minWidth: 0,
          gap: 1,
        }}
      >
        <Typography
          level="body-sm"
          sx={{
            fontWeight: selected ? 600 : 400,
            color: "#0d0d0d",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {modelLabel(model, t, getLabel)}
        </Typography>
        {tier && (
          <Typography
            level="body-sm"
            sx={{ color: "#9b9b9b", fontWeight: 400, whiteSpace: "nowrap" }}
          >
            {tier}
          </Typography>
        )}
      </Box>
      {selected && (
        <Check sx={{ fontSize: 18, color: "#6e6e80", flexShrink: 0 }} />
      )}
    </MenuItem>
  );
}

function UnconfiguredProviderRow({ provider }: { provider: ProviderId }) {
  const { t } = useTranslation();
  const providerName = t(PROVIDER_GROUP_LABELS[provider]);

  return (
    <Box sx={{ mt: 0.5 }}>
      <Typography level="body-xs" sx={sectionHeaderSx}>
        {providerName}
      </Typography>
      <Box
        sx={{
          px: 1.5,
          py: 1.125,
          minHeight: 40,
          display: "flex",
          alignItems: "center",
          color: "#c5c5d0",
          cursor: "default",
          userSelect: "none",
          pointerEvents: "none",
        }}
      >
        <Typography level="body-sm" sx={{ fontWeight: 400 }}>
          {t("modelSelector.addKeyForProvider", { provider: providerName })}
        </Typography>
      </Box>
    </Box>
  );
}

function UnconfiguredLocalModelsRow() {
  const { t } = useTranslation();
  const modals = useModals();

  return (
    <Box sx={{ mt: 0.5 }}>
      <Typography level="body-xs" sx={sectionHeaderSx}>
        {t("localModelsModal.sectionTitle")}
      </Typography>
      <MenuItem
        onClick={() => modals.open("/localModels")}
        sx={{
          borderRadius: "8px",
          py: 1.125,
          px: 1.5,
          minHeight: 40,
          color: "#c5c5d0",
          fontWeight: 400,
          "&:hover": { bgcolor: "#f3f3f3", color: "#0d0d0d" },
        }}
      >
        {t("modelSelector.addLocalModel")}
      </MenuItem>
    </Box>
  );
}

export function InlineModelSelector({
  selectedModel,
  setSelectedModel,
}: {
  selectedModel: ModelOverride | null;
  setSelectedModel: (model: ModelOverride) => void;
}) {
  const { t } = useTranslation();
  const modals = useModals();
  const { isProviderConfigured, keysLoaded } = useProviderKeyState();
  const { data: sidecarStatus } = useLocalModelsStatus();
  const enabledChatModels = useEnabledChatModelsStore((s) => s.enabled);
  const getLabel = useEnabledChatModelsStore((s) => s.getLabel);

  const enabledByProvider = useMemo(() => {
    const map = new Map<ProviderId, string[]>();
    for (const provider of DYNAMIC_PROVIDER_IDS) {
      map.set(provider, []);
    }
    for (const id of enabledChatModels) {
      const parsed = parseProviderModelId(id);
      if (parsed) {
        map.get(parsed.provider)?.push(id);
      }
    }
    return map;
  }, [enabledChatModels]);

  const enabledLocalModels = useMemo(
    () => enabledChatModels.filter((id) => isLocalModelId(id)),
    [enabledChatModels],
  );

  const showLocalSection =
    (sidecarStatus?.binaryInstalled || enabledLocalModels.length > 0) && enabledLocalModels.length > 0;

  const visibleProviderSections = DYNAMIC_PROVIDER_IDS.filter(
    (provider) =>
      keysLoaded &&
      isProviderConfigured(provider) &&
      (enabledByProvider.get(provider)?.length ?? 0) > 0,
  );

  const selectableModels: SelectableModelId[] = [
    "automatic",
    ...enabledLocalModels,
    ...visibleProviderSections.flatMap(
      (provider) => enabledByProvider.get(provider) ?? [],
    ),
  ];

  const active: SelectableModelId =
    selectedModel && selectableModels.includes(selectedModel)
      ? selectedModel
      : "automatic";
  const label = modelLabel(active, t, getLabel);
  const activeTier = modelTier(active, t);

  const handleSelect = (model: SelectableModelId) => {
    setSelectedModel(model as ModelOverride);
  };

  return (
    <Dropdown>
      <MenuButton
        sx={triggerSx}
        endDecorator={
          <KeyboardArrowDown sx={{ fontSize: 18, color: "#6e6e80" }} />
        }
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          <span>{label}</span>
          {activeTier && (
            <Box component="span" sx={{ color: "#9b9b9b", fontWeight: 400 }}>
              {activeTier}
            </Box>
          )}
        </Box>
      </MenuButton>
      <Menu placement="bottom-start" sx={menuSx}>
        <ModelMenuItem
          model="automatic"
          active={active}
          onSelect={handleSelect}
        />

        {DYNAMIC_PROVIDER_IDS.map((provider) => {
          if (!keysLoaded || isProviderConfigured(provider)) return null;
          return (
            <UnconfiguredProviderRow key={provider} provider={provider} />
          );
        })}

        {!showLocalSection && <UnconfiguredLocalModelsRow />}

        {showLocalSection && (
          <Box sx={{ mt: 0.5 }}>
            <Typography level="body-xs" sx={sectionHeaderSx}>
              {t("localModelsModal.sectionTitle")}
            </Typography>
            {enabledLocalModels.map((modelId) => (
              <ModelMenuItem
                key={modelId}
                model={modelId}
                active={active}
                onSelect={handleSelect}
              />
            ))}
          </Box>
        )}

        {visibleProviderSections.map((provider) => (
          <Box key={provider} sx={{ mt: 0.5 }}>
            <Typography level="body-xs" sx={sectionHeaderSx}>
              {t(PROVIDER_GROUP_LABELS[provider])}
            </Typography>
            {(enabledByProvider.get(provider) ?? []).map((modelId) => (
              <ModelMenuItem
                key={modelId}
                model={modelId}
                active={active}
                onSelect={handleSelect}
              />
            ))}
          </Box>
        ))}

        <MenuItem
          onClick={() => modals.open("/addModels")}
          sx={{
            mt: 0.5,
            borderTop: "1px solid #ececf1",
            borderRadius: "8px",
            py: 1.25,
            px: 1.5,
            minHeight: 40,
            color: "#0d0d0d",
            fontWeight: 500,
            fontFamily:
              'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
            "&:hover": { bgcolor: "#f3f3f3" },
          }}
        >
          <Add sx={{ fontSize: 18, color: "#6e6e80", mr: 1 }} />
          {t("modelSelector.addModel")}
        </MenuItem>
      </Menu>
    </Dropdown>
  );
}
