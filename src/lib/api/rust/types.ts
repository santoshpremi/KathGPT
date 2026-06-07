export type ProviderId =
  | "openrouter"
  | "openai"
  | "anthropic"
  | "gemini"
  | "perplexity";

export interface ProviderKeyStatus {
  id: ProviderId;
  configured: boolean;
  source: "stored" | "env" | "none" | string;
  maskedKey?: string;
}

export interface TestProviderKeyResponse {
  ok: boolean;
  message: string;
}

export interface RustChatSummary {
  id: string;
  name: string | null;
  modelOverride: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RustMessage {
  id: string;
  content: string;
  createdAt: string;
  fromAi: boolean;
  responseCompleted?: boolean;
  authorId?: string | null;
  chatId: string;
  generationModel?: string | null;
  attachmentIds: string[];
  ragSources: unknown[];
  citations: string[];
  artifactVersionId?: string | null;
  cancelled?: boolean;
  errorCode?: string | null;
  tokens: number;
  outputDocumentUrl?: string | null;
}

export interface SendMessageRequest {
  content: string;
  language?: string;
  modelOverride?: string | null;
  temperature?: number;
  customSystemPromptSuffix?: string;
  attachmentIds?: string[];
}

export type MessageStreamChunk =
  | { aiMessageId: string; generationModel: string }
  | { delta: string; citations: string[] }
  | { streamDone: true };
