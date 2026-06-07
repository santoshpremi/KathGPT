import { rustFetch } from "./client";
import type { RustChatSummary } from "./types";

export function listChats(limit = 50): Promise<RustChatSummary[]> {
  return rustFetch(`/chats?limit=${limit}`);
}

export function getChat(chatId: string): Promise<RustChatSummary> {
  return rustFetch(`/chats/${chatId}`);
}

export function createChat(input: {
  id: string;
  name?: string | null;
  modelOverride?: string | null;
}): Promise<RustChatSummary> {
  return rustFetch("/chats", {
    method: "POST",
    body: JSON.stringify({
      id: input.id,
      name: input.name,
      modelOverride: input.modelOverride ?? undefined,
    }),
  });
}

export function deleteChat(chatId: string): Promise<{ success: boolean }> {
  return rustFetch(`/chats/${chatId}`, { method: "DELETE" });
}

export function updateChat(
  chatId: string,
  body: { name?: string; modelOverride?: string | null },
): Promise<RustChatSummary> {
  const payload: Record<string, unknown> = {};
  if (body.name !== undefined) {
    payload.name = body.name;
  }
  if (body.modelOverride !== undefined) {
    payload.modelOverride = body.modelOverride;
    payload.setModelOverride = true;
  }
  return rustFetch(`/chats/${chatId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
