import { rustFetch } from "../api/rust/client";
import { fileToBase64 } from "./fileToBase64";

const SUPPORTED_PATTERN = /\.(txt|md|csv|pdf)$/i;

export function isSupportedTranslationFile(filename: string): boolean {
  return SUPPORTED_PATTERN.test(filename);
}

export async function readTranslationFile(file: File): Promise<string> {
  if (!isSupportedTranslationFile(file.name)) {
    throw new Error("unsupported");
  }

  if (/\.pdf$/i.test(file.name)) {
    const data = await fileToBase64(file);
    const result = await rustFetch<{ text: string }>("/files/extract-text", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, data }),
    });
    return result.text;
  }

  return file.text();
}
