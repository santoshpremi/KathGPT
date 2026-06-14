/** Rough token estimate (~4 characters per token). Keep in sync with Rust `tokens::estimate_tokens`. */
export function estimateTokens(text: string): number {
  const chars = text.length;
  if (chars === 0) return 0;
  return Math.ceil(chars / 4);
}
