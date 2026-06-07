import { rustFetch } from "./client";

export interface ImageModel {
  id: string;
  name: string;
  description: string;
  provider: string;
}

export interface GeneratedImage {
  url: string;
  revisedPrompt?: string;
}

export function listImageModels(): Promise<ImageModel[]> {
  return rustFetch("/images/models");
}

export function generateImages(input: {
  model: string;
  prompt: string;
  style?: string;
  aspectRatio?: string;
  count?: number;
}): Promise<GeneratedImage[]> {
  return rustFetch("/images/generate", {
    method: "POST",
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt,
      style: input.style,
      aspectRatio: input.aspectRatio,
      count: input.count ?? 1,
    }),
  });
}

export function improveImagePrompt(prompt: string): Promise<{ prompt: string }> {
  return rustFetch("/images/improve-prompt", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
}
