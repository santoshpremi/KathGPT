import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { ModelOverride } from "@shared/api/chat/chatTypes";
import type { Message } from "@shared/api/chat/message/messageTypes";
import { deleteMessagesFollowing, listMessages, streamMessage } from "../messages";
import type { RustMessage, SendMessageRequest } from "../types";

const MESSAGES_KEY = ["messages"] as const;

function toAppMessage(msg: RustMessage): Message {
  return {
    id: msg.id,
    content: msg.content,
    createdAt: msg.createdAt,
    fromAi: msg.fromAi,
    responseCompleted: msg.responseCompleted ?? true,
    authorId: msg.authorId ?? null,
    chatId: msg.chatId,
    generationModel: (msg.generationModel as Message["generationModel"]) ?? null,
    attachmentIds: msg.attachmentIds ?? [],
    citations: msg.citations ?? [],
    artifactVersionId: msg.artifactVersionId ?? null,
    cancelled: msg.cancelled ?? false,
    ragSources: (msg.ragSources ?? []) as Message["ragSources"],
    tokens: msg.tokens ?? 0,
    errorCode: msg.errorCode ?? null,
    outputDocumentUrl: msg.outputDocumentUrl ?? null,
  };
}

export function useChatMessages(chatId: string) {
  return useQuery({
    queryKey: [...MESSAGES_KEY, chatId],
    queryFn: async () => {
      const messages = await listMessages(chatId);
      return messages.map(toAppMessage);
    },
    enabled: !!chatId,
    placeholderData: keepPreviousData,
  });
}

type SendInput = {
  content: string;
  language: string;
  attachmentIds?: string[];
  customSystemPromptSuffix?: string;
  temperature?: number;
  chatId: string;
  modelOverride?: ModelOverride | null;
  outputFormat?: string;
  workflowExecutionId?: string;
};

export function useSendMessageStream() {
  const queryClient = useQueryClient();

  const sendMessage = async (input: SendInput) => {
    const body: SendMessageRequest = {
      content: input.content,
      language: input.language,
      modelOverride: input.modelOverride,
      temperature: input.temperature,
      customSystemPromptSuffix: input.customSystemPromptSuffix,
      attachmentIds: input.attachmentIds,
    };
    return streamMessage(input.chatId, body);
  };

  return { sendMessage, isPending: false };
}

export function useDeleteMessagesFollowing() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      chatId,
      messageId,
    }: {
      chatId: string;
      messageId: string;
    }) => deleteMessagesFollowing(chatId, messageId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: [...MESSAGES_KEY, variables.chatId],
      });
    },
  });
}
