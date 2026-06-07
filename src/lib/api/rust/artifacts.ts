import { getRustApiBase } from "./init";
import { rustFetch, RustApiError } from "./client";
import type { Artifact, ArtifactVersion } from "@shared/api/chat/artifact/artifactTypes";

export interface ArtifactVersionPreview {
  title: string;
  content: string;
  artifactId: string;
}

export async function getChatArtifact(chatId: string): Promise<Artifact | null> {
  const res = await fetch(`${getRustApiBase()}/chats/${chatId}/artifact`);
  if (res.status === 204 || res.status === 404) return null;
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    const message =
      typeof body?.error === "string" ? body.error : res.statusText;
    throw new RustApiError(res.status, message);
  }
  return res.json() as Promise<Artifact>;
}

export function getArtifactVersionPreview(
  versionId: string,
): Promise<ArtifactVersionPreview> {
  return rustFetch(`/artifact-versions/${versionId}`);
}

export function createArtifact(input: {
  chatId: string;
  title: string;
}): Promise<Artifact> {
  return rustFetch("/artifacts", {
    method: "POST",
    body: JSON.stringify({ chatId: input.chatId, title: input.title }),
  });
}

export function createArtifactVersion(
  artifactId: string,
  input: { content: string; fromChat?: boolean },
): Promise<ArtifactVersion> {
  return rustFetch(`/artifacts/${artifactId}/versions`, {
    method: "POST",
    body: JSON.stringify({
      content: input.content,
      fromChat: input.fromChat ?? false,
    }),
  });
}
