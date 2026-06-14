import { CropSquare, Send } from "@mui/icons-material";
import { Button, Textarea } from "@mui/joy";
import { motion } from "framer-motion";
import type { ComponentProps } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDropzone } from "react-dropzone";
import { twMerge } from "tailwind-merge";
import type {
  Chat,
  ModelOverride,
} from "@backend/api/chat/chatTypes";
import type { KnowledgeCollection } from "@backend/api/rag/dataPool/dataPoolTypes";
import { useUploadDocumentWithToast } from "../../../lib/api/documents";
import {
  useDocumentIntelligenceEnabled,
  useKnowledgeCollections,
  useMarkDataPoolSeen,
  useOrganizationQuery,
  useProductConfig,
  useUpdateRagMode,
} from "../../../lib/api/localHooks";
import { allowedMimeTypesForAdiDocuments } from "@backend/constants/mime";
import { useTranslation } from "../../../../src/lib/i18n";
import { NewSourceChip, SourceChip } from "./sources/SourceChip";
import { isCatalogLlmModel } from "../../util/llm";
import { WarningMessage } from "./WarningMessage";
import ChatSourceContainer, {
  type RagModeInput,
} from "./sources/ChatSourceContainer";
import { DocumentChip } from "./sources/DocumentChip";
import { CHAT_INPUT_ID } from "../../../lib/testIds";
import { InlineModelSelector } from "./InlineModelSelector";
import { ChatInputMenu } from "./ChatInputMenu";
import { ContextTokenIndicator } from "./ContextTokenIndicator";

export interface AttachedDocument {
  id: string;
  tokens: number;
}

interface ChatInputProps extends ComponentProps<typeof Textarea> {
  postMessage: ({
    content,
    attachmentIds,
    ragMode,
  }: {
    content: string;
    attachmentIds: string[];
    ragMode: RagModeInput;
  }) => void;
  onCancel?: () => void;
  setModelOverride?: (model: ModelOverride) => void;
  isGenerating?: boolean;
  showAttachmentButton?: boolean;
  startDecorator?: React.ReactNode;
  allowDocumentUpload?: boolean;
  embedded?: boolean;
  large?: boolean;
  value?: string;
  setValue?: (value: string) => void;
  model?: ModelOverride | null;
  chatTokens?: number;
  chat?: Chat;
}

export type SelectableKnowledgeCollections = (KnowledgeCollection & {
  isNew: boolean;
})[];

export const ChatInput = React.forwardRef(
  (
    {
      postMessage,
      startDecorator,
      disabled,
      onCancel,
      isGenerating,
      allowDocumentUpload = true,
      showAttachmentButton = true,
      embedded = false,
      large = false,
      value,
      setValue,
      model,
      setModelOverride,
      chatTokens,
      chat,
      ...textAreaProps
    }: ChatInputProps,
    ref: React.Ref<HTMLTextAreaElement>,
  ) => {
    const [ragMode, setRagMode] = useState<RagModeInput>({
      mode: chat?.ragMode ?? "OFF",
      customSourceId: chat?.customSourceId ?? undefined,
    });
    const [sources, setSources] = useState<SelectableKnowledgeCollections>([]);
    const [_input, _setInput] = useState("");
    const [numLoadingAttachments, setNumLoadingAttachments] = useState(0);
    const [sourceExpanded, setSourceExpanded] = useState(false);
    const [messageCreditWarningAccepted, setMessageCreditWarningAccepted] =
      useState(false);
    const [attachedDocuments, setAttachedDocuments] = useState<
      AttachedDocument[]
    >([]);

    const { data: productConfig } = useProductConfig();
    const { data: documentIntelligenceEnabled } =
      useDocumentIntelligenceEnabled();
    const { data: organization } = useOrganizationQuery();
    const { data: knowledgeCollections } = useKnowledgeCollections();

    const { mutateAsync: updateRagMode } = useUpdateRagMode();
    const { mutateAsync: markAsSeen } = useMarkDataPoolSeen();

    const { t } = useTranslation();
    const uploadDocument = useUploadDocumentWithToast();

    const attachmentUploaderRef = useRef<HTMLInputElement>(null);
    const folderUploaderRef = useRef<HTMLInputElement>(null);
    const textAreaRef = useRef<HTMLInputElement>(null);

    const input = value ?? _input;
    const setInput = setValue ?? _setInput;

    const selectedSource = sources.find(
      ({ id }) => id === ragMode.customSourceId,
    );
    const attachedDocumentIds = attachedDocuments?.map((d) => d.id) ?? [];
    const hasAttachments =
      attachedDocumentIds.length > 0 ||
      numLoadingAttachments > 0 ||
      selectedSource ||
      ragMode.mode === "AUTO";

    const newSource =
      !hasAttachments && !sourceExpanded && sources.some((s) => s.isNew);
    const isDisabled = disabled || numLoadingAttachments > 0;

    const fileUploadEnabled =
      documentIntelligenceEnabled &&
      allowDocumentUpload &&
      showAttachmentButton &&
      ragMode.mode === "OFF";

    const ragEnabled =
      !!productConfig?.enableRag &&
      attachedDocumentIds.length === 0 &&
      numLoadingAttachments === 0;

    const imageGenerationEnabled = Boolean(productConfig?.imageGeneration);

    const chosenModel: ModelOverride | null = model ?? null;

    useEffect(() => {
      if (!knowledgeCollections) return;
      setSources(
        knowledgeCollections.map((collection) => ({
          ...collection,
          createdAt: new Date(collection.createdAt),
          updatedAt: new Date(collection.updatedAt),
          isNew: false,
        })),
      );
    }, [knowledgeCollections, chat, setSources]);

    const send = () => {
      if (input.replace(/\na/g, "").trim() === "") return;

      postMessage({
        content: input.trim(),
        attachmentIds: attachedDocumentIds,
        ragMode,
      });
      setSourceExpanded(false);
      setInput("");
      setAttachedDocuments([]);
      setMessageCreditWarningAccepted(false);
    };

    const toggleRagMode = async (ragInput: RagModeInput) => {
      const { mode } = ragInput;
      const { customSourceId } = ragInput;
      const prev = { ...ragMode };
      const customSource = mode === "CUSTOM" ? customSourceId : undefined;

      let newMode = {
        mode,
        customSourceId: customSource,
      };
      if (mode === prev.mode && customSourceId === prev.customSourceId) {
        newMode = { mode: "OFF", customSourceId: undefined };
      }

      setRagMode(newMode);
      if (chat?.id) {
        await updateRagMode({
          chatId: chat.id,
          customSourceId: newMode.customSourceId,
          ragMode: newMode.mode,
        }).catch(() => setRagMode(prev));
      }
    };

    const attachFiles = useCallback(
      async (files: File[]) => {
        if (!fileUploadEnabled || files.length === 0) return;

        for (const file of files) {
          setNumLoadingAttachments((prev) => prev + 1);
          try {
            const { id, tokens } = await uploadDocument(file);
            setAttachedDocuments((prev) => [...prev, { id, tokens }]);
          } catch (e) {
            console.error(e);
          } finally {
            setNumLoadingAttachments((prev) => prev - 1);
          }
        }
      },
      [fileUploadEnabled, uploadDocument],
    );

    const onAddAttachment = async () => {
      const files = attachmentUploaderRef.current?.files;
      if (!files || files.length === 0) return;
      await attachFiles(Array.from(files));
      attachmentUploaderRef.current.value = "";
    };

    const onAddFolder = async () => {
      const files = folderUploaderRef.current?.files;
      if (!files || files.length === 0) return;
      await attachFiles(Array.from(files));
      folderUploaderRef.current.value = "";
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: (files) => void attachFiles(files),
      noClick: true,
      noKeyboard: true,
      disabled: !fileUploadEnabled || isDisabled,
      multiple: true,
    });

    const showSourceContainer = (open: boolean) => {
      if (open && newSource) {
        void markAsSeen("");
      }
      setSourceExpanded(open);
    };

    return (
      <>
        <motion.div
          {...getRootProps()}
          initial="normal"
          animate={sourceExpanded ? "padded" : "normal"}
          variants={{ padded: { marginTop: 140 }, normal: { marginTop: 0 } }}
          className={twMerge(
            "relative mx-auto w-full max-w-3xl",
            embedded && "max-w-none",
            isDragActive && "rounded-2xl ring-2 ring-[#10a37f] ring-offset-2",
          )}
          id="messageInput"
        >
          <input {...getInputProps()} />
          {!embedded && startDecorator}
          <input
            type="file"
            name="file"
            id="attachment"
            accept={allowedMimeTypesForAdiDocuments}
            hidden
            ref={attachmentUploaderRef}
            onChange={() => void onAddAttachment()}
            multiple
          />
          <input
            type="file"
            id="folderAttachment"
            hidden
            ref={folderUploaderRef}
            // @ts-expect-error webkitdirectory is supported in Chromium/WebKit
            webkitdirectory=""
            multiple
            onChange={() => void onAddFolder()}
          />
          <div className="flex min-w-0 flex-1 flex-col">
            {!embedded &&
              chosenModel &&
              isCatalogLlmModel(chosenModel) &&
              setModelOverride && (
                <WarningMessage
                  model={chosenModel}
                  setModelOverride={setModelOverride}
                  attachedDocuments={attachedDocuments}
                  input={input}
                  chatTokens={chatTokens}
                  messageCreditWarningAccepted={messageCreditWarningAccepted}
                  setMessageCreditWarningAccepted={
                    setMessageCreditWarningAccepted
                  }
                />
              )}

            <div className="relative">
              <ChatSourceContainer
                handleRagMode={toggleRagMode}
                ragMode={ragMode}
                sources={sources}
                isVisible={sourceExpanded}
                documents={attachedDocuments}
                fileUploadEnabled={!!fileUploadEnabled}
                ragEnabled={ragEnabled}
                uploadDocument={() => attachmentUploaderRef.current?.click()}
                removeDocument={(id) =>
                  setAttachedDocuments((prev) => prev.filter((d) => id != d.id))
                }
              />

              <div
                className={twMerge(
                  "flex w-full flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm focus-within:border-[#d4d4d4]",
                  large && "shadow-md",
                )}
              >
                {hasAttachments && (
                  <div className="flex flex-row flex-wrap items-center gap-2 border-b border-[var(--joy-palette-neutral-100)] px-4 py-2">
                    {attachedDocumentIds?.map((id) => (
                      <DocumentChip
                        documentId={id}
                        key={id}
                        onRemove={() => {
                          setAttachedDocuments(
                            attachedDocuments.filter((d) => d.id !== id),
                          );
                        }}
                      />
                    ))}
                    {numLoadingAttachments > 0 &&
                      new Array(numLoadingAttachments)
                        .fill({})
                        .map((_, i) => <DocumentChip key={i} loading />)}
                    {selectedSource && (
                      <SourceChip
                        text={selectedSource.name}
                        onDelete={async () => {
                          await toggleRagMode({ mode: "OFF" });
                        }}
                      />
                    )}
                    {ragMode.mode === "AUTO" && (
                      <SourceChip
                        text={t("knowledgeBase.automaticSource")}
                        onDelete={async () =>
                          await toggleRagMode({ mode: "OFF" })
                        }
                      />
                    )}
                  </div>
                )}

                <Textarea
                  ref={textAreaRef}
                  className="z-10 !border-0 !shadow-none"
                  variant="plain"
                  sx={{
                    "--Textarea-focusedHighlight": "transparent",
                    "--Textarea-focusedThickness": "0px",
                    backgroundColor: "transparent",
                    boxShadow: "none",
                    "&::before": {
                      boxShadow: "none",
                    },
                    "&:focus-within": {
                      boxShadow: "none",
                    },
                  }}
                  slotProps={{
                    textarea: {
                      "data-testid": CHAT_INPUT_ID,
                      ref,
                      sx: {
                        paddingX: "16px",
                        paddingTop: large ? "20px" : "14px",
                        paddingBottom: "8px",
                        fontSize: large ? "1rem" : "0.95rem",
                        minHeight: large ? "72px" : "48px",
                        outline: "none",
                        "&:focus": {
                          outline: "none",
                        },
                      },
                    },
                  }}
                  placeholder={
                    large ? t("chat.inputPlaceholder") : t("composeMessage")
                  }
                  autoFocus
                  maxRows={18}
                  minRows={large ? 2 : 1}
                  onKeyDown={(e) => {
                    if (input.replace(/\na/g, "").trim() === "") return;

                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (!isDisabled) send();
                    }
                  }}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  {...textAreaProps}
                />

                {(chosenModel ?? "automatic") && (
                  <div className="px-3 pt-1">
                    <ContextTokenIndicator
                      model={chosenModel ?? "automatic"}
                      chatTokens={chatTokens ?? 0}
                      input={input}
                      attachedDocuments={attachedDocuments}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 px-3 pb-3 pt-1">
                  <div className="flex min-w-0 flex-wrap items-center gap-1">
                    <div className="relative">
                      {newSource && (
                        <NewSourceChip
                          className="-translate-x-[41%] -translate-y-9"
                          onClick={() => showSourceContainer(true)}
                        />
                      )}
                      <ChatInputMenu
                        fileUploadEnabled={!!fileUploadEnabled}
                        ragEnabled={ragEnabled}
                        imageGenerationEnabled={imageGenerationEnabled}
                        onUploadFiles={() =>
                          attachmentUploaderRef.current?.click()
                        }
                        onUploadFolder={() =>
                          folderUploaderRef.current?.click()
                        }
                        onOpenSources={() => showSourceContainer(true)}
                        onInsertPrompt={(prompt) => setInput(prompt)}
                      />
                    </div>
                    {setModelOverride && (
                      <InlineModelSelector
                        selectedModel={chosenModel}
                        setSelectedModel={setModelOverride}
                      />
                    )}
                  </div>

                  {isGenerating && !!onCancel ? (
                    <Button onClick={onCancel} variant="outlined" size="sm">
                      <div className="flex flex-row items-center gap-2">
                        <CropSquare fontSize="small" />
                        {input.length > 0 ? t("resend") : t("cancel")}
                      </div>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="!rounded-full"
                      data-testid="submit-message-button"
                      onClick={send}
                      disabled={isDisabled}
                      sx={{
                        bgcolor: "#0d0d0d",
                        color: "#ffffff",
                        "&:hover": { bgcolor: "#353740" },
                        "&:disabled": {
                          bgcolor: "#ececf1",
                          color: "#6e6e80",
                        },
                      }}
                      endDecorator={<Send fontSize="small" />}
                    >
                      {!embedded && t("sendMessage")}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </>
    );
  },
);

ChatInput.displayName = "ChatInput";
