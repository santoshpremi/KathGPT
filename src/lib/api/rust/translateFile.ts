import { invoke } from "@tauri-apps/api/core";
import { fileToBase64 } from "../../translate/fileToBase64";
import { ensureRustApiReady, getRustApiBase, isTauriApp } from "./init";
import { rustFetch } from "./client";
import { downloadBlob } from "../../util";

export type TranslatedFileResult = {
  filename: string;
  mimeType: string;
  data: string;
  previewId?: string;
};

export async function createFilePreviewUrl(
  file: File,
): Promise<string> {
  const data = await fileToBase64(file);
  const mimeType = file.type || guessMime(file.name);
  const { previewId } = await rustFetch<{ previewId: string }>("/files/preview", {
    method: "POST",
    body: JSON.stringify({ data, mimeType }),
  });
  await ensureRustApiReady();
  return `${getRustApiBase()}/files/preview/${previewId}`;
}

export async function previewUrlFromId(previewId: string): Promise<string> {
  await ensureRustApiReady();
  return `${getRustApiBase()}/files/preview/${previewId}`;
}

function guessMime(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".csv")) return "text/csv";
  if (lower.endsWith(".md")) return "text/markdown";
  return "text/plain";
}

export function translateFile(input: {
  file: File;
  sourceLanguage?: string;
  targetLanguage: string;
}): Promise<TranslatedFileResult> {
  return fileToBase64(input.file).then((data) =>
    rustFetch<TranslatedFileResult>("/files/translate", {
      method: "POST",
      body: JSON.stringify({
        filename: input.file.name,
        data,
        sourceLanguage: input.sourceLanguage,
        targetLanguage: input.targetLanguage,
      }),
    }),
  );
}

export function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

export async function downloadTranslatedFile(
  result: TranslatedFileResult,
): Promise<string | null> {
  if (isTauriApp()) {
    const savedPath = await invoke<string>("save_translated_file", {
      filename: result.filename,
      dataBase64: result.data,
    });
    return savedPath;
  }

  const blob = base64ToBlob(result.data, result.mimeType);
  downloadBlob(blob, result.filename);
  return result.filename;
}
