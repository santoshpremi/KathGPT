import { rustFetch } from "./client";

export function translateText(input: {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}): Promise<{ translatedText: string }> {
  return rustFetch("/translate", {
    method: "POST",
    body: JSON.stringify({
      text: input.text,
      sourceLanguage: input.sourceLanguage,
      targetLanguage: input.targetLanguage,
    }),
  });
}
