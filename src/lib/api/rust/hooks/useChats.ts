import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Chat,
  ChatListItem,
  ModelOverride,
} from "@shared/api/chat/chatTypes";
import { useCurrentOrganizationId } from "../../useCurrentOrganizationId";
import * as rustChats from "../chats";
import type { RustChatSummary } from "../types";

const CHATS_KEY = ["chats"] as const;

export function toAppChat(
  chat: RustChatSummary,
  organizationId: string,
): Chat {
  return {
    id: chat.id,
    name: chat.name,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    hidden: false,
    modelOverride: (chat.modelOverride as ModelOverride | null) ?? null,
    organizationId,
    customSystemPromptSuffix: null,
    ragMode: "OFF",
    customSourceId: null,
    creditWarningAccepted: true,
    artifactId: null,
  };
}

export function toChatListItem(
  chat: RustChatSummary,
  organizationId: string,
): ChatListItem {
  return {
    id: chat.id,
    name: chat.name,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt,
    organizationId,
  };
}

export function useChatList(limit: number, organizationId: string) {
  return useQuery({
    queryKey: [...CHATS_KEY, "list", limit],
    queryFn: async () => {
      const chats = await rustChats.listChats(limit);
      return { items: chats.map((c) => toChatListItem(c, organizationId)) };
    },
    refetchOnWindowFocus: false,
  });
}

export function useChat(chatId: string, options?: { enabled?: boolean }) {
  const organizationId = useCurrentOrganizationId();

  return useQuery({
    queryKey: [...CHATS_KEY, chatId],
    queryFn: async () =>
      toAppChat(await rustChats.getChat(chatId), organizationId),
    enabled: !!chatId && (options?.enabled ?? true),
  });
}

export function useCreateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      id: string;
      name?: string | null;
      organizationId?: string;
      modelOverride?: string | null;
    }) =>
      rustChats.createChat({
        id: input.id,
        name: input.name,
        modelOverride: input.modelOverride,
      }),
    onSuccess: (data, variables) => {
      if (variables.organizationId) {
        queryClient.setQueryData(
          [...CHATS_KEY, variables.id],
          toAppChat(data, variables.organizationId),
        );
      }
    },
  });
}

export function useDeleteChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ chatId }: { chatId: string }) => rustChats.deleteChat(chatId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHATS_KEY });
    },
  });
}

export function useDeleteChats() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatIds }: { chatIds: string[] }) => {
      const results = await Promise.allSettled(
        chatIds.map((chatId) => rustChats.deleteChat(chatId)),
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        throw new Error(`Failed to delete ${failed} chat(s)`);
      }
      return { deleted: chatIds.length };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHATS_KEY });
    },
  });
}

export function useUpdateChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      chatId: string;
      name?: string;
      modelOverride?: ModelOverride | null;
    }) =>
      rustChats.updateChat(input.chatId, {
        name: input.name,
        modelOverride:
          input.modelOverride === "automatic" || input.modelOverride == null
            ? null
            : input.modelOverride,
      }),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(
        [...CHATS_KEY, variables.chatId],
        (current: Chat | undefined) =>
          current
            ? {
                ...current,
                ...(variables.name !== undefined ? { name: variables.name } : {}),
                ...(variables.modelOverride !== undefined
                  ? {
                      modelOverride:
                        variables.modelOverride === "automatic" ||
                        variables.modelOverride == null
                          ? null
                          : variables.modelOverride,
                    }
                  : {}),
                updatedAt: data.updatedAt,
              }
            : current,
      );
      void queryClient.invalidateQueries({ queryKey: CHATS_KEY });
      void queryClient.invalidateQueries({
        queryKey: [...CHATS_KEY, variables.chatId],
      });
    },
  });
}
