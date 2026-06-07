import { ensureRustApiReady, getRustApiBase } from "./init";
import { rustFetch, RustApiError } from "./client";
import type { MessageStreamChunk, RustMessage, SendMessageRequest } from "./types";

const STREAM_TIMEOUT_MS = 120_000;

export function listMessages(chatId: string): Promise<RustMessage[]> {
  return rustFetchMessages(chatId);
}

export function deleteMessagesFollowing(
  chatId: string,
  messageId: string,
): Promise<{ deleted: number }> {
  return rustFetch(`/chats/${chatId}/messages/${messageId}/following`, {
    method: "DELETE",
  });
}

async function rustFetchMessages(chatId: string): Promise<RustMessage[]> {
  await ensureRustApiReady();
  const res = await fetch(`${getRustApiBase()}/chats/${chatId}/messages`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new RustApiError(
      res.status,
      typeof body?.error === "string" ? body.error : res.statusText,
    );
  }
  return res.json();
}

function parseSseBlock(block: string): { event: string; data: string } | null {
  let event = "message";
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      data += line.slice(5).trim();
    }
  }
  if (!data) return null;
  return { event, data };
}

type ActiveStream = { chatId: string; controller: AbortController };

let activeStream: ActiveStream | null = null;

/** Abort the in-flight stream. When chatId is set, only aborts that chat's stream. */
export function abortActiveStream(chatId?: string) {
  if (!activeStream) return;
  if (chatId != null && activeStream.chatId !== chatId) return;
  activeStream.controller.abort();
  activeStream = null;
}

export async function* streamMessage(
  chatId: string,
  body: SendMessageRequest,
): AsyncGenerator<MessageStreamChunk> {
  abortActiveStream(chatId);
  const userAbort = new AbortController();
  const timeoutId = setTimeout(() => userAbort.abort(), STREAM_TIMEOUT_MS);
  activeStream = { chatId, controller: userAbort };
  const signal = userAbort.signal;

  try {
    await ensureRustApiReady();
    const api = getRustApiBase();

    const res = await fetch(`${api}/chats/${chatId}/messages/stream`, {
      method: "POST",
      signal,
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        content: body.content,
        language: body.language ?? "en",
        modelOverride:
          body.modelOverride && body.modelOverride !== "automatic"
            ? body.modelOverride
            : undefined,
        temperature: body.temperature,
        customSystemPromptSuffix: body.customSystemPromptSuffix,
        attachmentIds: body.attachmentIds ?? [],
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => res.statusText);
      let message = text;
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        // keep raw text
      }
      throw new RustApiError(
        res.status,
        message || `Request failed (${api})`,
      );
    }

    const reader = res.body?.getReader();
    if (!reader) {
      throw new RustApiError(500, "No response body");
    }

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const blocks = buffer.split("\n\n");
      buffer = blocks.pop() ?? "";

      for (const block of blocks) {
        const parsed = parseSseBlock(block.trim());
        if (!parsed) continue;

        if (parsed.event === "error") {
          throw new RustApiError(500, parsed.data);
        }

        if (parsed.event === "init") {
          const init = JSON.parse(parsed.data) as {
            aiMessageId: string;
            generationModel: string;
          };
          yield {
            aiMessageId: init.aiMessageId,
            generationModel: init.generationModel,
          };
        } else if (parsed.event === "delta") {
          const delta = JSON.parse(parsed.data) as {
            delta: string;
            citations?: string[];
          };
          yield {
            delta: delta.delta,
            citations: delta.citations ?? [],
          };
        } else if (parsed.event === "done") {
          yield { streamDone: true };
        }
      }
    }
  } finally {
    clearTimeout(timeoutId);
    if (activeStream?.controller === userAbort) {
      activeStream = null;
    }
  }
}
