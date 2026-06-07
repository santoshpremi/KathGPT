// backend/src/api/chat/chatTypes.ts
//import  { ApiDate } from "@apiTypes/Date";
import { ApiDate } from "@apiTypes/Date";
import z from "zod";
import type { LlmName } from "../../ai/llmMeta";
import { LlmNames } from "../../ai/llmMeta";

/**
 * Enum for chat model override settings.
 * Includes all options from ApiTextModelEnum and an additional 'automatic' option
 * which allows the system to select the best model automatically.
 */
export const ModelOverride = z.enum([
  "automatic",
  "sonar", 
  "sonar-deep-research",
  "gpt-4o-mini",
  "gpt-4o",
  "o1-us",
  "o3-mini",
  "claude-3-7-sonnet",
  "claude-3-7-sonnet-thinking",
  "gemini-1.5-pro", 
  "gemini-2.0-flash",
  "llama-3.3-fast",
  "deepseek-v3",
  "deepseek-r1"
]).catch("gpt-4o-mini");


export const RagMode = z.enum(["OFF", "AUTO", "CUSTOM"]);
export type RagMode = z.infer<typeof RagMode>;

export const RagModeInput = z
  .object({
    ragMode: RagMode.default("OFF"),
    customSourceId: z.string().optional(),
  })
  .refine(({ ragMode, customSourceId }) => {
    return ragMode !== "CUSTOM" || (ragMode === "CUSTOM" && customSourceId);
  });

export const Chat = z.object({
  id: z.string(),
  name: z.string().nullable(),
  createdAt: ApiDate,
  updatedAt: ApiDate,
  hidden: z.boolean(),
  modelOverride: ModelOverride.nullable(),
  organizationId: z.string(),
  customSystemPromptSuffix: z.string().nullable(),
  ragMode: RagMode.default("OFF"),
  customSourceId: z.string().nullable(),
  creditWarningAccepted: z.boolean(),
  artifactId: z.string().nullable(),
});

export const ChatCreateInput = Chat.omit({
  id: true,
  organizationId: true,
  createdAt: true,
  updatedAt: true,
  artifactId: true,
})
  .extend({
    messages: z
      .object({
        content: z.string(),
        fromAi: z.boolean(),
      })
      .array(),
  })
  .partial();

export type ModelOverride = z.infer<typeof ModelOverride>;
export type Chat = z.infer<typeof Chat>;
export type ChatCreateInput = z.infer<typeof ChatCreateInput>;

export const ChatSearchInput = z.object({
  query: z.string(),
  limit: z.number().min(1).max(100).default(100),
  cursor: z.string().optional(),
});

export const MatchingMessage = z.object({
  content: z.string(),
  snippet: z.string(),
  rank: z.number(),
});

export const ChatSearchResult = z.object({
  id: z.string(),
  name: z.string().nullable(),
  organizationId: z.string(),
  matchingMessages: z.array(MatchingMessage),
  updatedAt: ApiDate,
});

export const ChatSearchOutput = z.object({
  results: z.array(ChatSearchResult),
  hasMore: z.boolean(),
  nextCursor: z.string().optional(),
});

export type ChatSearchInput = z.infer<typeof ChatSearchInput>;
export type ChatSearchOutput = z.infer<typeof ChatSearchOutput>;
export type ChatSearchResult = z.infer<typeof ChatSearchResult>;
export type MatchingMessage = z.infer<typeof MatchingMessage>;

export type ChatSearchRawResult = {
  id: string;
  matching_messages: Array<{
    content: string;
    snippet: string;
    rank: number;
    messageId: string;
  }>;
  name: string | null;
  organizationId: string;
  max_rank: number;
  updatedAt: string;
};

export const ChatListItem = z.object({
  id: z.string(),
  name: z.string().nullable(),
  createdAt: ApiDate,
  updatedAt: ApiDate,
  organizationId: z.string(),
});

export const ChatInfiniteQueryResultSchema = z.object({
  items: ChatListItem.array(),
  nextCursor: z.string().optional(),
});

export type ChatListItem = z.infer<typeof ChatListItem>;
export type ChatInfiniteQueryResult = z.infer<
  typeof ChatInfiniteQueryResultSchema
>;

