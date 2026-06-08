import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  deleteLocalModel,
  DownloadProgress,
  getInstalledLocalModels,
  getLocalModelsStatus,
  searchLocalModelCatalog,
  startModelDownload,
} from "../localModels";
import { getRustApiBase } from "../init";

const STATUS_KEY = ["local-models", "status"] as const;
const INSTALLED_KEY = ["local-models", "installed"] as const;

export function useLocalModelsStatus() {
  return useQuery({
    queryKey: STATUS_KEY,
    queryFn: getLocalModelsStatus,
    refetchInterval: 10_000,
  });
}

export function useInstalledLocalModels(enabled = true) {
  return useQuery({
    queryKey: INSTALLED_KEY,
    queryFn: getInstalledLocalModels,
    enabled,
    retry: false,
  });
}

export function useLocalModelCatalog(search: string, enabled = true) {
  return useQuery({
    queryKey: ["local-models", "catalog", search],
    queryFn: () => searchLocalModelCatalog(search),
    enabled,
    staleTime: 5_000,
    refetchInterval: 3_000,
  });
}

/** Fire-and-forget download trigger. Progress is tracked via SSE. */
export function useStartModelDownload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => startModelDownload(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["local-models", "catalog"] });
    },
  });
}

/** SSE-based real-time progress for all active downloads. */
export function useDownloadProgress(): DownloadProgress[] {
  const [progress, setProgress] = useState<DownloadProgress[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    const baseUrl = getRustApiBase();
    if (!baseUrl) return;

    const es = new EventSource(`${baseUrl}/local-models/progress`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as DownloadProgress[];
        setProgress(data);

        // When any job completes, refresh installed list and catalog
        if (data.some((p) => p.done && !p.error)) {
          void queryClient.invalidateQueries({ queryKey: INSTALLED_KEY });
          void queryClient.invalidateQueries({ queryKey: ["local-models", "catalog"] });
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      // SSE connection dropped; stop and leave last known state
      es.close();
    };

    return () => es.close();
  }, [queryClient]);

  return progress;
}

export function useDeleteLocalModel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => deleteLocalModel(name),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INSTALLED_KEY });
      void queryClient.invalidateQueries({ queryKey: ["local-models", "catalog"] });
    },
  });
}

// Backwards-compat alias
export const usePullLocalModel = useStartModelDownload;
