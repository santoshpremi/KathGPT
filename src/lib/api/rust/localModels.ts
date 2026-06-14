import { rustFetch } from "./client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SidecarStatus {
  ready: boolean;
  binaryInstalled: boolean;
  loadedModel?: string;
}

export interface InstalledLocalModel {
  name: string;
  displayName: string;
  sizeBytes: number;
  parameterSize: string;
  quantization: string;
  loaded: boolean;
}

export interface CatalogLocalModel {
  name: string;
  displayName: string;
  description: string;
  tags: string[];
  parameterSize: string;
  sizeBytes: number;
  minRamGb: number;
  installed: boolean;
  downloading: boolean;
  compatible: boolean;
  recommended: boolean;
  quant: string;
}

export type GpuHint = "apple_metal" | "cuda" | "cpu";

export interface LocalHardwareProfile {
  totalRamGb: number;
  effectiveRamGb: number;
  platform: string;
  arch: string;
  gpuHint: GpuHint;
  recommendedModel?: string;
  recommendedQuant?: string;
}

export type DownloadPhase =
  | "downloadingRuntime"
  | "downloadingModel"
  | "extracting"
  | "complete";

export interface DownloadProgress {
  modelName: string;
  phase: DownloadPhase;
  bytesDone: number;
  bytesTotal: number;
  fraction: number;
  done: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

export function getLocalModelsStatus(): Promise<SidecarStatus> {
  return rustFetch("/local-models/status");
}

export function getLocalHardwareProfile(): Promise<LocalHardwareProfile> {
  return rustFetch("/local-models/hardware");
}

export function getInstalledLocalModels(): Promise<InstalledLocalModel[]> {
  return rustFetch("/local-models/installed");
}

export function searchLocalModelCatalog(search = ""): Promise<CatalogLocalModel[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set("search", search.trim());
  const qs = params.toString();
  return rustFetch(`/local-models/catalog${qs ? `?${qs}` : ""}`);
}

/** Fire-and-forget — the model downloads in the background. Poll progress via SSE. */
export function startModelDownload(name: string): Promise<{ ok: boolean }> {
  return rustFetch("/local-models/download", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export function deleteLocalModel(name: string): Promise<{ ok: boolean }> {
  return rustFetch("/local-models/delete", {
    method: "DELETE",
    body: JSON.stringify({ name }),
  });
}

// ---------------------------------------------------------------------------
// Kept for backwards compatibility (stream.rs calls /pull as an alias too)
// ---------------------------------------------------------------------------
export const pullLocalModel = startModelDownload;
