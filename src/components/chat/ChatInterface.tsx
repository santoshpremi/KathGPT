import { Sheet } from "@mui/joy";
import _ from "lodash";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { LLM_META, type LlmName } from "@backend/ai/llmMeta";

import type {
  Chat,
  ModelOverride,
} from "@backend/api/chat/chatTypes";
import type {
  Message,
  MessageGenerationProgress,
} from "@backend/api/chat/message/messageTypes";

import { useQueryClient } from "@tanstack/react-query";
import { useOrganizationQuery } from "../../lib/api/localHooks";
import {
  listMessages,
  RustApiError,
  useChat,
  useChatList,
  useChatMessages,
  useCreateChat,
  useDeleteChat,
  abortActiveStream,
  useDeleteMessagesFollowing,
  useSendMessageStream,
  useUpdateChat,
} from "../../lib/api/rust";
import { useNavigate } from "../../router";
import { useNewChat } from "../../lib/hooks/useNewChat";
import { useDraftChatStore } from "../../lib/context/draftChatStore";
import { getChat } from "../../lib/api/rust/chats";
import { toAppChat } from "../../lib/api/rust/hooks/useChats";
import { useCurrentOrganizationId } from "../../lib/api/useCurrentOrganizationId";
import { deriveChatTitle } from "@shared/util/deriveChatTitle";
import { useMe } from "../../lib/api/user";
import { useQueuedMessagesStore } from "../../lib/context/queuedMessagesStore";
import { handleGenericError } from "../../lib/errorHandling";
import { useTranslation } from "../../lib/i18n";
import { maxStringLength } from "../../lib/util";
import { DelayedLoader } from "../util/DelayedLoader";
import { isSpecificLLM } from "../util/llm";

import { ChatInput } from "./input/ChatInput";
import { ChatQuickActions } from "./input/ChatQuickActions";
import { ChatWelcome } from "./ChatWelcome";
import { ChatNotFound } from "./ChatNotFound";
import { SmartIterations } from "./input/SmartIterations";
import { ArtifactProvider, useArtifact } from "../artifacts/ArtifactProvider";
import { ChatItem } from "./messages/ChatItem";
import { type DocumentOutputFormat } from "@backend/document/documentTypes";

export { ErrorDisplay as Catch } from "../util/ErrorDisplay";

interface ErrorMetadata {
  source: string;
  messages?: Message[];
  oldMessageId?: string;
  filteredMessage?: Message;
}

interface ChatInterfaceProps {
  chatId: string;
  showSmartIterations?: boolean;
  showAttachmentButton?: boolean;
  embedded?: boolean;
  sheetProps?: React.ComponentProps<typeof Sheet>;
  onPrompt?: ({
    prompt,
    messageHistory,
    attachmentIds,
  }: {
    prompt: string;
    messageHistory: Message[];
    attachmentIds?: string[];
  }) => void;
  onMessageHistoryChange?: (
    messages: Message[],
    type: "prompt" | "response",
  ) => void;
  readonly?: boolean;
  customSystemPromptSuffix?: string;
  customTemperature?: number;
  autoFocus?: boolean;
}

export function ChatInterface({
  chatId,
  embedded,
  ...props
}: ChatInterfaceProps) {
  return (
    <div className="flex h-full w-full min-h-0 min-w-0 flex-1">
      <ArtifactProvider chatId={chatId} embedded={embedded}>
        <Interface chatId={chatId} embedded={embedded} {...props} />
      </ArtifactProvider>
    </div>
  );
}

function Interface({
  chatId,
  showSmartIterations = true,
  showAttachmentButton = true,
  embedded = false,
  sheetProps = {},
  onPrompt,
  onMessageHistoryChange,
  readonly = false,
  customSystemPromptSuffix,
  customTemperature,
  autoFocus = true,
}: ChatInterfaceProps) {
  // State
  const [tempMessages, setTempMessages] = useState([] as Message[]);
  const [localModelOverride, setLocalModelOverride] = useState<
    ModelOverride | null | undefined
  >(undefined);
  const [completed, setCompleted] = useState(true);
  const waitingForQueuedMessage = useRef<boolean>(false);
  const [progress, setProgress] = useState<
    MessageGenerationProgress | undefined
  >(undefined);

  // Refs
  const lastHistoryChangeTrigger = useRef<Message[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const cancelFunctionRef = useRef<() => Promise<void>>();
  const sendInFlightRef = useRef(false);
  const pendingAiMessageIdRef = useRef<string | null>(null);

  // Hooks
  const { showArtifact, visible } = useArtifact();
  const { t, i18n } = useTranslation();
  const me = useMe();
  const organizationId = useCurrentOrganizationId();
  const navigate = useNavigate();
  const { startNewChat } = useNewChat();
  const { data: chatsData } = useChatList(50, organizationId);
  const queryClient = useQueryClient();
  const mutateMessages = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["messages", chatId] });
    void queryClient.invalidateQueries({ queryKey: ["chats", chatId] });
    void queryClient.invalidateQueries({ queryKey: ["chats"] });
  }, [queryClient, chatId]);

  // Stores
  const enqueueMessage = useQueuedMessagesStore((s) => s.addQueuedMessage);
  const clearMessageQueue = useQueuedMessagesStore((s) => s.clear);
  const queuedMessages = useQueuedMessagesStore((s) => s.queuedMessages);
  const shiftQueuedMessages = useQueuedMessagesStore(
    (s) => s.shiftQueuedMessage,
  );

  const isDraft = useDraftChatStore((s) => s.isDraft(chatId));
  const clearDraft = useDraftChatStore((s) => s.clearDraft);

  useEffect(() => {
    setLocalModelOverride(undefined);
  }, [chatId]);

  // Mutations
  const { sendMessage: createMessageMutation } = useSendMessageStream();
  const { mutateAsync: createChat } = useCreateChat();
  const { mutateAsync: deleteChat } = useDeleteChat();
  const { mutateAsync: updateChat } = useUpdateChat();
  const abortMessageGenerationMutation = async () => {
    abortActiveStream(chatId);
    setCompleted(true);
    setProgress(undefined);
    setTempMessages([]);
  };
  const { mutateAsync: deleteMessagesFollowingMutation } =
    useDeleteMessagesFollowing();

  // Queries
  const { data: organization } = useOrganizationQuery();
  const {
    data: chat,
    error: chatFetchError,
    isError: chatIsError,
  } = useChat(chatId, { enabled: !isDraft });
  const {
    data: apiMessages,
    isFetched: messagesFetched,
    isError: messagesIsError,
  } = useChatMessages(chatId);

  const draftChat = useMemo(
    (): Chat => ({
      id: chatId,
      name: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      hidden: false,
      modelOverride: null,
      organizationId,
      customSystemPromptSuffix: null,
      ragMode: "OFF",
      customSourceId: null,
      creditWarningAccepted: true,
      artifactId: null,
    }),
    [chatId, organizationId],
  );

  const ensureChatExists = useCallback(async () => {
    const modelOverride =
      localModelOverride !== undefined ? localModelOverride : null;

    const created = await createChat({
      id: chatId,
      name: null,
      organizationId,
      modelOverride,
    });
    queryClient.setQueryData(
      ["chats", chatId],
      toAppChat(created, organizationId),
    );
    clearDraft(chatId);
  }, [
    chatId,
    clearDraft,
    createChat,
    localModelOverride,
    organizationId,
    queryClient,
  ]);

  // Persisted chats must not stay in the draft list (stale sessionStorage breaks sends).
  useEffect(() => {
    if (!isDraft) return;
    const inSidebar = chatsData?.items?.some((c) => c.id === chatId);
    if (inSidebar || (apiMessages?.length ?? 0) > 0) {
      clearDraft(chatId);
    }
  }, [isDraft, chatsData?.items, apiMessages?.length, chatId, clearDraft]);

  useEffect(() => {
    return () => {
      void (async () => {
        if (useDraftChatStore.getState().isDraft(chatId)) {
          useDraftChatStore.getState().clearDraft(chatId);
          return;
        }
        if (sendInFlightRef.current || pendingAiMessageIdRef.current) {
          return;
        }
        const hasQueued = useQueuedMessagesStore
          .getState()
          .queuedMessages.some((m) => m.chatId === chatId);
        if (hasQueued) return;

        const messagesState = queryClient.getQueryState<Message[]>([
          "messages",
          chatId,
        ]);
        const messages = messagesState?.data;
        if (messagesState?.status === "success" && messages?.length === 0) {
          try {
            await deleteChat({ chatId });
            void queryClient.invalidateQueries({ queryKey: ["chats"] });
          } catch {
            // Chat may already have been removed.
          }
        }
      })();
    };
  }, [chatId, deleteChat, queryClient]);

  const syncChatTitle = useCallback(
    async (firstMessage?: string) => {
      const refreshed = await queryClient.fetchQuery({
        queryKey: ["chats", chatId],
        queryFn: async () =>
          toAppChat(await getChat(chatId), organizationId),
      });
      if (refreshed.name?.trim()) {
        void queryClient.refetchQueries({ queryKey: ["chats"] });
        return;
      }
      const title = firstMessage ? deriveChatTitle(firstMessage) : "";
      if (!title) return;
      await updateChat({ chatId, name: title });
    },
    [chatId, organizationId, queryClient, updateChat],
  );

  useEffect(() => {
    if (!chat?.id || chat.name?.trim() || !apiMessages?.length) return;
    const firstUser = apiMessages.find((m) => !m.fromAi);
    if (!firstUser?.content.trim()) return;
    void syncChatTitle(firstUser.content);
  }, [chat?.id, chat?.name, apiMessages, syncChatTitle]);

  const chatNotFound =
    !isDraft &&
    chatIsError &&
    chatFetchError instanceof RustApiError &&
    chatFetchError.status === 404;

  useEffect(() => {
    if (!chatNotFound) return;

    clearDraft(chatId);
    useQueuedMessagesStore.setState({
      queuedMessages: useQueuedMessagesStore
        .getState()
        .queuedMessages.filter((m) => m.chatId !== chatId),
    });

    void startNewChat();
  }, [chatNotFound, chatId, clearDraft, startNewChat]);

  useEffect(() => {
    const completedApiMessages =
      apiMessages?.filter((m) => m.responseCompleted || !m.fromAi) ?? [];

    // Check if the filtered messages are the same as the previous ones, to avoid redundant updates
    if (_.isEqual(lastHistoryChangeTrigger.current, completedApiMessages))
      return;

    lastHistoryChangeTrigger.current = completedApiMessages;

    onMessageHistoryChange?.(
      completedApiMessages,
      completedApiMessages[completedApiMessages.length - 1]?.fromAi
        ? "response"
        : "prompt",
    );
  }, [apiMessages, onMessageHistoryChange]);

  useEffect(() => {
    if (completed) {
      void modelCheck();
      inputRef.current?.focus({
        preventScroll: true,
      });
    }
  }, [completed]);

  const setModelOverride = async (model: ModelOverride | null) => {
    const stored =
      model === "automatic" || model == null ? null : model;
    setLocalModelOverride(stored);

    if (isDraft && !chat) {
      return;
    }

    try {
      await updateChat({
        chatId,
        modelOverride: model,
      });
      queryClient.setQueryData(
        ["chats", chatId],
        (current: Chat | undefined) =>
          current ? { ...current, modelOverride: stored } : current,
      );
      setLocalModelOverride(undefined);
    } catch (error) {
      handleGenericError(error, "modelUpdateFailed", { source: "chat" });
    }
  };

  const cancelMessageGeneration = useCallback(async () => {
    waitingForQueuedMessage.current = false;
    clearMessageQueue();
    if (completed) return;
    await cancelFunctionRef.current?.();
  }, [completed]);

  const createMessage = useCallback(
    async ({
      message,
      attachmentIds = [],
      customModel,
      outputFormat,
      workflowExecutionId,
    }: {
      message: string;
      attachmentIds?: string[];
      customModel?: ModelOverride;
      outputFormat?: DocumentOutputFormat | null;
      workflowExecutionId?: string;
    }) => {
      if (sendInFlightRef.current) return;
      sendInFlightRef.current = true;

      const wasFirstMessage = (apiMessages?.length ?? 0) === 0;
      const isWorkflowOutput = outputFormat && workflowExecutionId;
      const promptTempMessages: Message[] = isWorkflowOutput
        ? []
        : [
            {
              fromAi: false,
              content: message,
              createdAt: new Date().toISOString(),
              authorId: me?.id ?? null,
              chatId,
              id: "temp",
              attachmentIds,
              generationModel: null,
              responseCompleted: true,
              citations: [],
              artifactVersionId: null,
              cancelled: false,
              ragSources: [],
              tokens: 0,
              errorCode: null,
              outputDocumentUrl: null
            },
          ];

      function getGenerationModel() {
        if (customModel == null) {
          return null;
        }
        return isSpecificLLM(customModel) ? customModel : "gpt-4o-mini";
      }

      const aiTempMessage: Message = {
        fromAi: true,
        content: "",
        createdAt: new Date(Date.now() + 10).toISOString(),
        authorId: null,
        chatId,
        id: "temp_ai",
        attachmentIds: [],
        artifactVersionId: null,
        generationModel: getGenerationModel(),
        responseCompleted: false,
        citations: [],
        cancelled: false,
        ragSources: [],
        tokens: 0,
        outputDocumentUrl: isWorkflowOutput ? "LOADING" : undefined,
      };

      setProgress(undefined);
      pendingAiMessageIdRef.current = null;
      setTempMessages([...promptTempMessages, aiTempMessage]);
      setCompleted(false);

      let mergedProgress = {};

      onPrompt?.({
        prompt: message,
        messageHistory: [...(apiMessages ?? []), ...promptTempMessages],
        attachmentIds,
      });

      let cancelled = false;
      const aiMessageId: { current: string | null } = { current: null };

      // this is the function that will be called when the user cancels the message generation
      cancelFunctionRef.current = async () => {
        // only cancel once
        if (cancelled) return;
        cancelled = true;

        setCompleted(true);
        waitingForQueuedMessage.current = false;
        sendInFlightRef.current = false;

        // the AI message id should always be here, since the server sends it first thing in the response, if not, there is also no content we need to sync. If the user actually does manage to cancel before the package arrives, the message won't be marked as cancelled and when the user refreshes the page later the generated message will be displayed.
        aiMessageId.current && (await abortMessageGenerationMutation());

        // server messages sync and then flush temp message
        mutateMessages();
        if (wasFirstMessage) void syncChatTitle(message);
        setTempMessages([]);
      };

      try {
      await ensureChatExists();

      // this will be the package stream for the completion
      const res = await createMessageMutation({
        content: message,
        language: i18n.language?.split("-")[0] ?? "en",
        attachmentIds,
        customSystemPromptSuffix,
        temperature: customTemperature,
        chatId,
        modelOverride: customModel,
        outputFormat: outputFormat?.toString() || undefined,
        workflowExecutionId,
      });

      // here we accumulate the response from the incoming chunks
      let fullResponse = "";

      // iterate over the chunks from the server
      for await (const chunk of res) {
        // if the user cancelled, break the loop
        if (cancelled) break;

        // if the AI message id is in the chunk, set it and skip this packages since it is not a response
        if ("aiMessageId" in chunk) {
          aiMessageId.current = chunk.aiMessageId;
          pendingAiMessageIdRef.current = chunk.aiMessageId;
          setTempMessages((currentTempMessages) =>
            currentTempMessages.map((m) =>
              m.fromAi
                ? {
                    ...m,
                    generationModel: chunk.generationModel as Message["generationModel"],
                    id: chunk.aiMessageId,
                  }
                : m,
            ),
          );
          if (wasFirstMessage) void syncChatTitle(message);
          continue;
        }

        if ("progress" in chunk) {
          mergedProgress = _.merge({}, mergedProgress, chunk.progress);
          setProgress(mergedProgress);
          continue;
        }

        if ("streamDone" in chunk) {
          continue;
        }

        fullResponse += chunk.delta;

        // update the temp message with the response
        setTempMessages((currentTempMessages) =>
          currentTempMessages.map((m) =>
            m.fromAi
              ? {
                  ...m,
                  content: fullResponse,
                  citations: chunk.citations,
                }
              : m,
          ),
        );
      }
      // if the user cancelled, we don't need to sync the messages since that already happened
      if (cancelled) return;
      if (fullResponse.includes("<artifact>")) {
        showArtifact();
      }
      if (wasFirstMessage) void syncChatTitle(message);
      } catch (error) {
        if (!cancelled && error instanceof Error && error.name !== "AbortError") {
          handleGenericError(error, "messageSendFailed", { source: "chat" });
        }
      } finally {
        setCompleted(true);
        waitingForQueuedMessage.current = false;
        sendInFlightRef.current = false;
        pendingAiMessageIdRef.current = null;
        if (!cancelled) {
          await queryClient.refetchQueries({ queryKey: ["messages", chatId] });
          void queryClient.invalidateQueries({ queryKey: ["chats", chatId] });
          void queryClient.invalidateQueries({ queryKey: ["chats"] });
          setTempMessages([]);
        }
      }
    },
    [
      abortMessageGenerationMutation,
      createMessageMutation,
      customTemperature,
      onPrompt,
      apiMessages,
      chatId,
      me?.id,
      mutateMessages,
      i18n.language,
      customSystemPromptSuffix,
      syncChatTitle,
      ensureChatExists,
      queryClient,
    ],
  );

  const regenerateMessage = useCallback(
    async (aiMessageId: Message) => {
      await cancelMessageGeneration();

      if (!apiMessages) return; // impossible
      // get the messsage before the AI message
      const index = apiMessages.findIndex((m) => m.id === aiMessageId.id);
      const userMessage = apiMessages[index - 1];
      if (!userMessage) {
        handleGenericError(
          new Error("no user message found before ai message"),
          "generateMessageFailed",
          { source: "chat" },
          true
        );
      }

      await deleteMessagesFollowingMutation({
        chatId,
        messageId: userMessage.id,
      });
      await mutateMessages();

      enqueueMessage({
        chatId,
        content: userMessage.content,
        attachmentIds: userMessage.attachmentIds,
      });
    },
    [
      deleteMessagesFollowingMutation,
      apiMessages,
      mutateMessages,
      chatId,
      enqueueMessage,
      cancelMessageGeneration,
    ],
  );

  const editMessage = useCallback(
    async (oldMessageId: string, content: string) => {
      await cancelMessageGeneration();

      if (!apiMessages) return; // impossible
      const oldMessage = apiMessages.find((m) => m.id === oldMessageId);
      if (!oldMessage) {
        // if we are currently generating a message it will not be in the apiMessages
        await mutateMessages();
        const updatedMessages = (
          await queryClient.fetchQuery({
            queryKey: ["messages", chatId],
            queryFn: () => listMessages(chatId),
          })
        ).map((m) => ({
          ...m,
          responseCompleted: m.responseCompleted ?? true,
          authorId: m.authorId ?? null,
          generationModel: m.generationModel ?? null,
          attachmentIds: m.attachmentIds ?? [],
          citations: m.citations ?? [],
          artifactVersionId: m.artifactVersionId ?? null,
          cancelled: m.cancelled ?? false,
          ragSources: m.ragSources ?? [],
          errorCode: m.errorCode ?? null,
          outputDocumentUrl: m.outputDocumentUrl ?? null,
        }));

        // the message we are trying to edit will be the second last message
        const updatedOldMessage = updatedMessages[updatedMessages.length - 2];
        if (!updatedOldMessage) {
          handleGenericError(
            new Error("no message found to edit"),
            "generateMessageFailed",
            {
              source: "chat",
              oldMessageId
            } as ErrorMetadata,
            true,
          );
        }
        oldMessageId = updatedOldMessage.id;
      }
      await deleteMessagesFollowingMutation({
        chatId,
        messageId: oldMessageId,
      });
      await mutateMessages();
      enqueueMessage({
        chatId,
        content,
        attachmentIds: oldMessage?.attachmentIds ?? [],
      });
    },
    [
      deleteMessagesFollowingMutation,
      mutateMessages,
      chatId,
      apiMessages,
      enqueueMessage,
      cancelMessageGeneration,
      ensureChatExists,
    ],
  );

  const modelCheck = async () => {
    const openMessages = queuedMessages.some((m) => m.chatId === chatId);
    const modelOverride = chat?.modelOverride as ModelOverride | null | undefined;
    if (openMessages || !modelOverride || !isSpecificLLM(modelOverride)) return;
    const meta = LLM_META[modelOverride as LlmName];
    if (!meta) return;

    if (!meta.allowChat) {
      void setModelOverride(
        (organization?.defaultModel as ModelOverride) ?? ("gpt-4o-mini" as ModelOverride),
      );
    }
  };

  useEffect(() => {
    if (!isDraft && chat === undefined) return;
    if (chatIsError) return;
    if (!completed) return;
    const filteredMessage = queuedMessages.find((m) => m.chatId === chatId);
    if (filteredMessage && !waitingForQueuedMessage.current) {
      waitingForQueuedMessage.current = true;
      shiftQueuedMessages(chatId);
      void createMessage({
        message: filteredMessage.content,
        attachmentIds: filteredMessage.attachmentIds,
        customModel: filteredMessage.modelOverride,
        outputFormat: filteredMessage.outputFormat,
        workflowExecutionId: filteredMessage.workflowExecutionId,
      }).catch((e: Error) => {
        waitingForQueuedMessage.current = false;
        if (e.name === "AbortError") return;
        handleGenericError(e, "messageSendFailed", { source: "chat" });
        console.error(e);
      });
    }
  }, [
    queuedMessages.length,
    chat,
    chatIsError,
    isDraft,
    chatId,
    createMessage,
    shiftQueuedMessages,
    completed,
  ]);

  const persistedChat = isDraft ? undefined : chat;
  const resolvedChat = (persistedChat ?? draftChat) as Chat;
  const messagesReady =
    messagesFetched ||
    tempMessages.length > 0 ||
    !completed ||
    messagesIsError;
  const chatName = maxStringLength(resolvedChat?.name ?? undefined, 80);

  const messagesList = useMemo(
    () =>
      [...(apiMessages ?? []), ...tempMessages.map((c) => ({ ...c, id: c.id + "temp" }))].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [apiMessages, tempMessages],
  );

  useEffect(() => {
    chatContainerRef.current?.scrollTo({
      top: chatContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messagesList.length]);

  const recoverFromPersistedReply = useCallback(() => {
    if (completed || tempMessages.length === 0) return false;

    const pendingAiId = pendingAiMessageIdRef.current;
    if (pendingAiId) {
      const saved = apiMessages?.find((m) => m.id === pendingAiId);
      if (saved?.fromAi && saved.content.trim()) {
        setTempMessages([]);
        setCompleted(true);
        sendInFlightRef.current = false;
        waitingForQueuedMessage.current = false;
        pendingAiMessageIdRef.current = null;
        return true;
      }
    }

    const sorted = [...(apiMessages ?? [])].sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    const last = sorted[sorted.length - 1];
    const pendingUser = tempMessages.find((m) => !m.fromAi);
    if (!pendingUser || !last?.fromAi || !last.content.trim()) return false;

    setTempMessages([]);
    setCompleted(true);
    sendInFlightRef.current = false;
    waitingForQueuedMessage.current = false;
    pendingAiMessageIdRef.current = null;
    return true;
  }, [apiMessages, completed, tempMessages]);

  // Recover when the server saved a reply but the live SSE stream dropped.
  useEffect(() => {
    recoverFromPersistedReply();
  }, [recoverFromPersistedReply]);

  useEffect(() => {
    if (completed) return;
    const poll = setInterval(() => {
      void queryClient
        .refetchQueries({ queryKey: ["messages", chatId] })
        .then(() => recoverFromPersistedReply());
    }, 1000);
    return () => clearInterval(poll);
  }, [completed, chatId, queryClient, recoverFromPersistedReply]);

  if (chatNotFound) return <DelayedLoader />;

  if (!messagesReady)
    return (
      <Sheet
        className={twMerge("relative h-full w-full")}
        variant="soft"
        {...sheetProps}
        sx={{
          backgroundColor: embedded ? "transparent" : undefined,
        }}
      >
        <DelayedLoader />
      </Sheet>
    );

  const chatTokens = (apiMessages ?? []).reduce((acc, m) => acc + m.tokens, 0);
  const isEmptyChat = messagesList.length === 0;

  const postMessage = async ({
    content,
    attachmentIds,
  }: {
    content: string;
    attachmentIds: string[];
  }) => {
    await cancelMessageGeneration();
    const chatModel = resolvedChat?.modelOverride as string | null | undefined;
    const customModel =
      chatModel && chatModel !== "automatic"
        ? (chatModel as ModelOverride)
        : localModelOverride !== undefined
          ? localModelOverride
          : undefined;
    void createMessage({
      message: content,
      attachmentIds,
      customModel,
    }).catch((e: Error) => {
      if (e.name === "AbortError") return;
      console.error(e);
    });
  };

  return (
    <Sheet
      className="relative flex h-full w-full grow flex-col overflow-x-hidden bg-white"
      variant="plain"
      {...sheetProps}
      sx={{
        backgroundColor: embedded ? "transparent" : "#ffffff",
      }}
      onClick={() => {
        embedded && inputRef.current?.focus();
      }}
    >
      <div
        className={twMerge(
          "flex flex-grow flex-col overflow-y-auto overscroll-y-contain",
          isEmptyChat && !embedded
            ? "items-center justify-center"
            : "justify-between",
          visible && "no-scrollbar",
        )}
        ref={chatContainerRef}
      >
        {isEmptyChat && !embedded ? (
          <div className="flex w-full max-w-3xl flex-col items-center gap-8 px-6 py-8">
            <ChatWelcome firstName={me?.firstName} />
          </div>
        ) : (
          <>
            {!embedded && chatName && (
              <span className="px-6 pb-4 pt-6 text-center text-lg font-medium text-[var(--joy-palette-neutral-700)]">
                {chatName}
              </span>
            )}
            <div className="flex w-full flex-col-reverse pb-4">
              {messagesList.map((message) => (
                <ChatItem
                  key={message.id}
                  chat={resolvedChat!}
                  message={message}
                  onEdit={async (content: string) => {
                    await editMessage(message.id, content);
                  }}
                  progress={progress}
                  regenerateMessage={regenerateMessage}
                  setModelOverride={setModelOverride}
                  embedded={embedded}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {!readonly && (
        <div
          className={twMerge(
            "relative z-10 flex w-full flex-col items-center gap-4 bg-white px-6 pb-8 pt-2",
            embedded && "bg-transparent p-0",
            isEmptyChat && !embedded && "pt-0",
          )}
        >
          {showSmartIterations && !isEmptyChat && (
            <div className="flex w-full max-w-3xl flex-row justify-center gap-4 overflow-x-auto">
              <SmartIterations
                disabled={!completed}
                onClick={(prompt) => {
                  enqueueMessage({
                    chatId,
                    content: prompt,
                  });
                }}
              />
            </div>
          )}
          <ChatInput
            chat={resolvedChat!}
            isGenerating={!completed}
            embedded={embedded}
            large={isEmptyChat && !embedded}
            model={
              (localModelOverride !== undefined
                ? localModelOverride
                : resolvedChat?.modelOverride ?? null) as ModelOverride | null
            }
            setModelOverride={setModelOverride}
            chatTokens={chatTokens}
            postMessage={postMessage}
            onCancel={cancelMessageGeneration}
            ref={inputRef}
            autoFocus={autoFocus}
            showAttachmentButton={showAttachmentButton}
          />
          {isEmptyChat && !embedded && (
            <ChatQuickActions
              disabled={!completed}
              onAction={(prompt) => {
                enqueueMessage({
                  chatId,
                  content: prompt,
                });
              }}
            />
          )}
        </div>
      )}
    </Sheet>
  );
}
