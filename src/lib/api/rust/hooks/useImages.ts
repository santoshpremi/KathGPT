import { useMutation, useQuery } from "@tanstack/react-query";
import {
  generateImages,
  improveImagePrompt,
  listImageModels,
} from "../images";

export function useImageModels() {
  return useQuery({
    queryKey: ["imageModels"],
    queryFn: listImageModels,
    staleTime: 60_000,
  });
}

export function useGenerateImages() {
  return useMutation({
    mutationFn: generateImages,
  });
}

export function useImproveImagePrompt() {
  return useMutation({
    mutationFn: (prompt: string) => improveImagePrompt(prompt),
  });
}
