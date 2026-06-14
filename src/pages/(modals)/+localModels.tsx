import { Check, CloudDownload, Delete, Memory } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Input,
  LinearProgress,
  ModalClose,
  ModalDialog,
  Stack,
  Switch,
  Typography,
} from "@mui/joy";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import RouteModal from "../../components/util/RouteModal";
import { useEnabledChatModelsStore } from "../../lib/context/enabledChatModelsStore";
import {
  useDeleteLocalModel,
  useDownloadProgress,
  useInstalledLocalModels,
  useLocalHardware,
  useLocalModelCatalog,
  useLocalModelsStatus,
  useStartModelDownload,
} from "../../lib/api/rust";
import type { CatalogLocalModel, DownloadProgress, LocalHardwareProfile } from "../../lib/api/rust";
import { toLocalModelId } from "../../lib/provider/modelIds";
import { useTranslation } from "../../lib/i18n";
import { ConfirmModal } from "../../components/sidebar/tree/ConfirmModal";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function phaseLabel(progress: DownloadProgress): string {
  if (progress.error) return "Failed";
  if (progress.done) return "Complete";
  switch (progress.phase) {
    case "downloadingRuntime":
      return "Setting up runtime…";
    case "downloadingModel":
      return `Downloading ${formatBytes(progress.bytesDone)} / ${progress.bytesTotal > 0 ? formatBytes(progress.bytesTotal) : "…"}`;
    case "extracting":
      return "Extracting…";
    default:
      return "Working…";
  }
}

// ---------------------------------------------------------------------------
// Installed model row
// ---------------------------------------------------------------------------

function InstalledModelRow({
  modelId,
  label,
  meta,
  loaded,
  onDelete,
  deleting,
}: {
  modelId: string;
  label: string;
  meta?: string;
  loaded?: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const enabled = useEnabledChatModelsStore((s) => s.isEnabled(modelId));
  const setEnabled = useEnabledChatModelsStore((s) => s.setEnabled);

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1,
        px: 1.5,
        py: 1,
        borderRadius: "8px",
        "&:hover": { bgcolor: "#f7f7f8" },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography level="body-sm" sx={{ color: "#0d0d0d", fontWeight: 500 }}>
          {label}
        </Typography>
        {meta && (
          <Typography level="body-xs" sx={{ color: "#9b9b9b" }}>
            {meta}
          </Typography>
        )}
        {loaded && (
          <Chip size="sm" variant="soft" color="success" sx={{ mt: 0.5 }}>
            Engine loaded
          </Chip>
        )}
      </Box>
      <Switch
        checked={enabled}
        onChange={(e) => setEnabled(modelId, e.target.checked)}
        endDecorator={enabled ? <Check sx={{ fontSize: 16 }} /> : null}
        slotProps={{ input: { "aria-label": label } }}
      />
      <IconButton
        size="sm"
        color="danger"
        variant="plain"
        aria-label="Delete"
        loading={deleting}
        onClick={onDelete}
      >
        <Delete sx={{ fontSize: 18 }} />
      </IconButton>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Catalog row with download progress
// ---------------------------------------------------------------------------

function CatalogRow({
  model,
  progress,
  onDownload,
}: {
  model: CatalogLocalModel;
  progress?: DownloadProgress;
  onDownload: () => void;
}) {
  const isDownloading = !!progress && !progress.done;
  const hasFailed = progress?.error != null;
  const tooHeavy = !model.compatible;

  return (
    <Box
      sx={{
        px: 1.5,
        py: 1.5,
        borderRadius: "8px",
        border: model.recommended
          ? "1px solid #c7d2fe"
          : tooHeavy
            ? "1px dashed #fca5a5"
            : "1px solid #ececf1",
        bgcolor: model.recommended ? "#eef2ff" : tooHeavy ? "#fffafa" : "#fafafa",
        opacity: tooHeavy ? 0.85 : 1,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack direction="row" alignItems="center" gap={1} flexWrap="wrap">
            <Typography level="title-sm">{model.displayName}</Typography>
            {model.recommended && (
              <Chip size="sm" variant="soft" color="primary">
                Best for your device
              </Chip>
            )}
            <Chip size="sm" variant="soft" color="neutral">
              {model.quant}
            </Chip>
            <Chip size="sm" variant="soft" color="neutral">
              {model.parameterSize}
            </Chip>
            <Chip size="sm" variant="soft" color={tooHeavy ? "warning" : "neutral"} startDecorator={<Memory sx={{ fontSize: 12 }} />}>
              {model.minRamGb}GB RAM
            </Chip>
            {model.installed && (
              <Chip size="sm" variant="soft" color="success">
                Downloaded
              </Chip>
            )}
            {tooHeavy && (
              <Chip size="sm" variant="soft" color="warning">
                Needs more RAM
              </Chip>
            )}
          </Stack>
          <Typography level="body-xs" sx={{ color: "#6e6e80", mt: 0.5 }}>
            {model.description}
          </Typography>
          <Typography level="body-xs" sx={{ color: "#9b9b9b", mt: 0.25 }}>
            ~{formatBytes(model.sizeBytes)}
          </Typography>
          {model.tags.length > 0 && (
            <Stack direction="row" gap={0.5} flexWrap="wrap" sx={{ mt: 0.75 }}>
              {model.tags.map((tag) => (
                <Chip key={tag} size="sm" variant="outlined" color="neutral">
                  {tag}
                </Chip>
              ))}
            </Stack>
          )}
        </Box>
        <Button
          size="sm"
          variant={model.installed ? "outlined" : "solid"}
          color={hasFailed ? "danger" : model.installed ? "neutral" : tooHeavy ? "warning" : "primary"}
          startDecorator={<CloudDownload sx={{ fontSize: 16 }} />}
          loading={isDownloading}
          disabled={model.installed || isDownloading}
          onClick={onDownload}
          sx={{ flexShrink: 0, mt: 0.5 }}
        >
          {model.installed ? "Downloaded" : hasFailed ? "Retry" : tooHeavy ? "Download anyway" : "Download"}
        </Button>
      </Stack>

      {/* Progress bar */}
      {progress && !progress.done && (
        <Box sx={{ mt: 1.25 }}>
          <LinearProgress
            determinate={progress.bytesTotal > 0}
            value={progress.fraction * 100}
            size="sm"
            sx={{ borderRadius: 4 }}
          />
          <Typography level="body-xs" sx={{ color: "#9b9b9b", mt: 0.5 }}>
            {phaseLabel(progress)}
          </Typography>
        </Box>
      )}

      {/* Error */}
      {hasFailed && (
        <Alert size="sm" variant="soft" color="danger" sx={{ mt: 1 }}>
          {progress!.error}
        </Alert>
      )}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main modal
// ---------------------------------------------------------------------------

export default function Route() {
  return <LocalModelsModal />;
}

function gpuHintLabel(hint: LocalHardwareProfile["gpuHint"]): string {
  switch (hint) {
    case "apple_metal":
      return "Apple Metal GPU";
    case "cuda":
      return "CUDA GPU";
    default:
      return "CPU";
  }
}

function LocalModelsModal() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [showCompatibleOnly, setShowCompatibleOnly] = useState(true);
  const [deletingModel, setDeletingModel] = useState<string | null>(null);

  const { data: status, isLoading: statusLoading } = useLocalModelsStatus();
  const { data: hardware } = useLocalHardware();
  const { data: installed = [], isLoading: installedLoading, refetch: refetchInstalled } =
    useInstalledLocalModels();
  const { data: catalog = [], isLoading: catalogLoading } = useLocalModelCatalog(search);

  const allProgress = useDownloadProgress();
  const { mutateAsync: startDownload } = useStartModelDownload();
  const { mutateAsync: deleteModel, isPending: deleting } = useDeleteLocalModel();

  const syncLocalLabels = useEnabledChatModelsStore((s) => s.syncLocalLabels);
  const setEnabled = useEnabledChatModelsStore((s) => s.setEnabled);

  useEffect(() => {
    if (installed.length > 0) {
      syncLocalLabels(
        installed.map((m) => ({ name: m.name, displayName: m.displayName })),
      );
    }
  }, [installed, syncLocalLabels]);

  // Refetch installed list when a download completes
  const completedCount = allProgress.filter((p) => p.done && !p.error).length;
  useEffect(() => {
    if (completedCount > 0) {
      void refetchInstalled();
    }
  }, [completedCount, refetchInstalled]);

  const filteredInstalled = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return installed;
    return installed.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.displayName.toLowerCase().includes(q),
    );
  }, [installed, search]);

  const handleDownload = async (name: string) => {
    try {
      await startDownload(name);
      // Download runs in the background; progress comes via SSE
    } catch (err) {
      toast.error((err as Error)?.message ?? "Download failed");
    }
  };

  const progressByModel = useMemo(() => {
    const map: Record<string, DownloadProgress> = {};
    for (const p of allProgress) {
      map[p.modelName] = p;
    }
    return map;
  }, [allProgress]);

  const visibleCatalog = useMemo(() => {
    if (!showCompatibleOnly) return catalog;
    return catalog.filter((m) => m.compatible);
  }, [catalog, showCompatibleOnly]);

  const recommendedModel = useMemo(
    () => catalog.find((m) => m.recommended) ?? null,
    [catalog],
  );

  const deletingMeta = useMemo(() => {
    if (!deletingModel) return null;
    return installed.find((m) => m.name === deletingModel) ?? null;
  }, [deletingModel, installed]);

  return (
    <>
      <ConfirmModal
        open={!!deletingModel}
        onClose={() => setDeletingModel(null)}
        customTitle={t("localModels.deleteTitle", "Delete local model?")}
        customMessage={
          deletingMeta ? (
            <Stack spacing={1}>
              <Typography level="body-sm">
                {t("localModels.deleteMessage", {
                  name: deletingMeta.displayName,
                  size: formatBytes(deletingMeta.sizeBytes),
                })}
              </Typography>
              {deletingMeta.loaded && (
                <Typography level="body-sm" textColor="warning">
                  {t(
                    "localModels.deleteLoadedWarning",
                    "This model is currently loaded in the engine. It will be unloaded before deletion.",
                  )}
                </Typography>
              )}
            </Stack>
          ) : null
        }
        customConfirmText={t("delete", "Delete")}
        onSure={async () => {
          if (!deletingModel) return;
          await deleteModel(deletingModel);
          setEnabled(toLocalModelId(deletingModel), false);
          toast.success("Model deleted");
          setDeletingModel(null);
          void refetchInstalled();
        }}
      />
      <RouteModal>
        <ModalDialog
          sx={{
            maxWidth: 580,
            width: "100%",
            maxHeight: "90vh",
            overflow: "auto",
            bgcolor: "#ffffff",
          }}
        >
          <ModalClose />
          <Typography level="title-lg" sx={{ color: "#0d0d0d", mb: 0.5 }}>
            Add Local Model
          </Typography>
          <Typography level="body-sm" sx={{ color: "#6e6e80", mb: 2 }}>
            Download AI models that run on your device — no API key, no internet after download.
          </Typography>

          {hardware && (
            <Alert variant="soft" color="primary" size="sm" sx={{ mb: 0 }}>
              <Stack spacing={1}>
                <Typography level="body-sm">
                  Detected <strong>{hardware.totalRamGb} GB RAM</strong>
                  {hardware.effectiveRamGb < hardware.totalRamGb
                    ? ` · ~${hardware.effectiveRamGb} GB available for models`
                    : ""}
                  {" · "}
                  {gpuHintLabel(hardware.gpuHint)}
                  {hardware.recommendedQuant && (
                    <>
                      {" · "}
                      {t("localModels.autoQuant", {
                        quant: hardware.recommendedQuant,
                      })}
                    </>
                  )}
                </Typography>
                {recommendedModel && !recommendedModel.installed && (
                  <Button
                    size="sm"
                    variant="solid"
                    startDecorator={<CloudDownload sx={{ fontSize: 16 }} />}
                    loading={!!progressByModel[recommendedModel.name] && !progressByModel[recommendedModel.name]?.done}
                    onClick={() => void handleDownload(recommendedModel.name)}
                  >
                    Download recommended — {recommendedModel.displayName}
                  </Button>
                )}
              </Stack>
            </Alert>
          )}

          {statusLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size="sm" />
            </Box>
          ) : (
            <Stack spacing={2}>
              {/* Runtime status chip */}
              {status && (
                <Alert
                  variant="soft"
                  color={status.ready ? "success" : "neutral"}
                  size="sm"
                >
                  {status.ready
                    ? `Engine running${status.loadedModel ? ` · ${status.loadedModel}` : ""}`
                    : status.binaryInstalled
                    ? "Engine installed — will start when you select a model"
                    : "Engine will be downloaded automatically on first model download (~15 MB)"}
                </Alert>
              )}

              <Input
                size="sm"
                placeholder="Search models…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 0.5 }}>
                <Typography level="body-sm" sx={{ color: "#6e6e80" }}>
                  Show models that fit this device
                </Typography>
                <Switch
                  checked={showCompatibleOnly}
                  onChange={(e) => setShowCompatibleOnly(e.target.checked)}
                  slotProps={{ input: { "aria-label": "Show compatible models only" } }}
                />
              </Stack>

              {/* Installed models */}
              {filteredInstalled.length > 0 && (
                <Box>
                  <Typography
                    level="body-xs"
                    sx={{
                      px: 1.5,
                      pb: 0.75,
                      color: "#9b9b9b",
                      fontWeight: 600,
                      fontSize: "0.6875rem",
                      letterSpacing: "0.04em",
                    }}
                  >
                    DOWNLOADED MODELS
                  </Typography>
                  {installedLoading ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                      <CircularProgress size="sm" />
                    </Box>
                  ) : (
                    <Stack spacing={0.25}>
                      {filteredInstalled.map((model) => {
                        const meta = [
                          formatBytes(model.sizeBytes),
                          model.parameterSize,
                          model.quantization,
                        ]
                          .filter(Boolean)
                          .join(" · ");

                        return (
                          <InstalledModelRow
                            key={model.name}
                            modelId={toLocalModelId(model.name)}
                            label={model.displayName}
                            meta={meta}
                            loaded={model.loaded}
                            deleting={deleting && deletingModel === model.name}
                            onDelete={() => setDeletingModel(model.name)}
                          />
                        );
                      })}
                    </Stack>
                  )}
                  <Divider sx={{ mt: 1.5 }} />
                </Box>
              )}

              {/* Catalog */}
              <Box>
                <Typography
                  level="body-xs"
                  sx={{
                    px: 1.5,
                    pb: 0.75,
                    color: "#9b9b9b",
                    fontWeight: 600,
                    fontSize: "0.6875rem",
                    letterSpacing: "0.04em",
                  }}
                >
                  AVAILABLE MODELS
                </Typography>
                {catalogLoading ? (
                  <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
                    <CircularProgress size="sm" />
                  </Box>
                ) : (
                  <Stack spacing={1} sx={{ maxHeight: 400, overflowY: "auto", pr: 0.5 }}>
                    {visibleCatalog.map((model) => (
                      <CatalogRow
                        key={model.name}
                        model={model}
                        progress={progressByModel[model.name]}
                        onDownload={() => void handleDownload(model.name)}
                      />
                    ))}
                    {visibleCatalog.length === 0 && (
                      <Typography level="body-sm" sx={{ px: 1.5, py: 2, color: "#9b9b9b" }}>
                        {showCompatibleOnly
                          ? "No compatible models match your search. Turn off the filter to see larger models."
                          : "No models match your search."}
                      </Typography>
                    )}
                  </Stack>
                )}
              </Box>
            </Stack>
          )}
        </ModalDialog>
      </RouteModal>
    </>
  );
}
