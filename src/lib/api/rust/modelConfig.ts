import { rustFetch } from "./client";

export function getEnabledModels(): Promise<string[]> {
  return rustFetch("/model-config/enabled");
}

export function getAvailableModels(): Promise<string[]> {
  return rustFetch("/model-config/available");
}
