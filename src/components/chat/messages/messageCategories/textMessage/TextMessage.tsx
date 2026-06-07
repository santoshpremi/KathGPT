import { ContentCopy, Edit, Replay, Send } from "@mui/icons-material";
import {
  Button,
  ButtonGroup,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/joy";

import type { RefObject } from "react";
import { useMemo, useRef, useState } from "react";
import { BounceLoader } from "react-spinners";
import "./TextMessage.scss";
import {
  type Message,
  type MessageGenerationProgress,
  type RagSource,
  type ResultComponent,
  MessageGenerationStep,
} from "@backend/api/chat/message/messageTypes";
import { useOrganization } from "../../../../../lib/api/organization";
import { useCopySafe } from "../../../../../lib/hooks/useCopySafe";
import { usePrimaryColor } from "../../../../../lib/hooks/useTheme";
import { AiMessageAvatar } from "../../AiMessageAvatar";
import { useSmoothTypingText } from "../../../../util/useSmoothTypingText";
import { DocumentChip } from "../../../input/sources/DocumentChip";
import { DataPoolChip } from "../../../input/sources/DataPoolChip";
import { ChatItemLayout } from "../../ChatItemLayout";
import { MarkdownRenderer } from "../../../markdown/MarkdownRenderer";
import { LlmName } from "@backend/ai/llmMeta";
import { type Chat } from "@backend/api/chat/chatTypes";
import { ArtifactPreview } from "../../../../artifacts/ArtifactPreview";
import { UserAvatar } from "../../../../auth/userMenu/UserAvatar";
import { Citations } from "../../Citations";
import { MessageEditor } from "../../MessageEditor";
import { useTranslation } from "../../../../../lib/i18n";

export function TextMessage({
  chat,
  message,
  onRegenerate,
  onEdit,
  embedded,
  progress,
}: {
  chat: Chat;
  message: Message;
  onRegenerate: () => void;
  onEdit: (content: string) => void;
  embedded?: boolean;
  progress?: MessageGenerationProgress;
}) {
  const { t } = useTranslation();

  const messageContentRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  const citations = message.citations.map((citation) => ({
    link: citation,
    title: citation,
  }));

  if (citations.length > 0) {
    message.content.replace(/\[(\d+)\]/g, (_, number) => {
      return `[#${number}]`; // could also display an icon with a number
    });
  }

  const [editedContent, setEditedContent] = useState(message.content);

  const generating = message.fromAi && !message.responseCompleted;

  const smoothContent = useSmoothTypingText(message.content);
  const content = generating ? smoothContent : message.content;

  const onEditSafe = (newContent: string) => {
    if (
      newContent.trim().length > 0 &&
      newContent.trim() !== message.content.trim()
    ) {
      onEdit(newContent);
    }
    setEditing(false);
    setEditedContent(message.content);
  };

  const organization = useOrganization();
  const currentModel = chat?.modelOverride
    ? LlmName.parse(chat.modelOverride)
    : organization?.defaultModel;

  const model: LlmName = (message.generationModel ??
    currentModel ??
    "gpt-4o-mini") as LlmName;

  const primaryColor = usePrimaryColor();

  const showArtifact = useMemo(() => {
    return (
      !!message.artifactVersionId || message.content.includes("<artifact>")
    );
  }, [message.content, message.artifactVersionId]);

  function combineRagSources(ragSources: RagSource[]): {
    knowledgeCollectionId: string;
    queries: Record<string, ResultComponent[]>;
  }[] {
    const combinedSourcesMap = new Map<
      string,
      Record<string, ResultComponent[]>
    >();

    ragSources.forEach((source) => {
      const { knowledgeCollectionId, queries, resultComponents } = source;

      if (!combinedSourcesMap.has(knowledgeCollectionId)) {
        combinedSourcesMap.set(knowledgeCollectionId, {});
      }
      const query = queries?.map((q, index) => `${index + 1}: ${q}`).join("\n");

      const collection: Record<string, ResultComponent[]> =
        combinedSourcesMap.get(knowledgeCollectionId)!;

      if (collection[query ?? "-"] == undefined) {
        collection[query ?? "-"] = [];
      }

      collection[query ?? "-"].push(...resultComponents);
    });

    const combined = Array.from(combinedSourcesMap.entries()).map(
      ([knowledgeCollectionId, queries]) => ({
        knowledgeCollectionId,
        queries,
      }),
    );
    return combined;
  }

  const combinedSources = combineRagSources(message.ragSources);

  const currentStepLabel = useMemo(() => {
    switch (progress?.currentStepType) {
      case MessageGenerationStep.FormulatingQueries:
        return t("messageGenerationProgress.formulatingQueries");
      case MessageGenerationStep.SearchingForInformation:
        return t("messageGenerationProgress.searchingForInformation", {
          numQueries: progress?.queryCount,
          numPools: progress?.collectionCount,
        });
      case MessageGenerationStep.GeneratingResponse:
        return t("messageGenerationProgress.generatingResponse");
    }

    return t("messageGenerationProgress.initializing");
  }, [progress, t]);

  return (
    <ChatItemLayout
      icon={
        message.fromAi ? (
          <AiMessageAvatar />
        ) : (
          <UserAvatar userId={message.authorId} />
        )
      }
      message={message}
      embedded={embedded}
      generating={generating}
    >
      {generating && (
        <div className="flex items-center gap-2">
          <BounceLoader color={primaryColor} key="spinner" size={20} />
          {progress && (
            <Typography color="neutral">{currentStepLabel}</Typography>
          )}
        </div>
      )}
      <div
        ref={messageContentRef}
        style={{
          minHeight: !embedded ? "3rem" : "0",
        }}
      >
        <div>
          <Typography
            color="neutral"
            component="div"
            sx={{ fontFamily: "inherit", "& p": { fontFamily: "inherit" } }}
          >
            {editing && (
              <MessageEditor
                editedContent={editedContent}
                setEditedContent={setEditedContent}
                setEditing={setEditing}
                onEditSafe={onEditSafe}
              />
            )}
            {message.cancelled && (
              <div>
                <Typography level="body-sm" fontStyle="italic">
                  {t("messageCancelled")}
                </Typography>
              </div>
            )}
            {!editing && !message.cancelled && (
              <div className="pr-7">
                <MarkdownRenderer
                  content={content}
                  sources={message.ragSources}
                />
                <Citations citations={citations} />
                {showArtifact && (
                  <ArtifactPreview id={message.artifactVersionId} />
                )}
              </div>
            )}
          </Typography>
        </div>
      </div>
      <div className="flex flex-row flex-wrap gap-2">
        {message.attachmentIds.map((id) => (
          <DocumentChip documentId={id} key={id} />
        ))}
        {(combinedSources ?? []).map((source) => (
          <DataPoolChip
            id={source.knowledgeCollectionId}
            key={source.knowledgeCollectionId}
            results={source}
          />
        ))}
      </div>
      <div className="absolute bottom-0 right-0 p-2">
        {message.fromAi && message.responseCompleted && (
          <AiMessageOptions
            onRegenerate={onRegenerate}
            messageContentRef={messageContentRef}
            content={message.content}
          />
        )}
        {!message.fromAi && (
          <UserMessageOptions
            onEdit={() => {
              setEditing(true);
            }}
            onEditSafe={onEditSafe}
            editedContent={editedContent}
            isEditing={editing}
          />
        )}
      </div>
    </ChatItemLayout>
  );
}

function UserMessageOptions({
  onEdit,
  onEditSafe,
  editedContent,
  isEditing,
}: {
  onEdit: () => void;
  onEditSafe: (newContent: string) => void;
  editedContent: string;
  isEditing?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-row items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
      {isEditing ? (
        <Tooltip title={t("sendMessage")}>
          <IconButton
            size="sm"
            onClick={() => onEditSafe(editedContent.trim())}
          >
            <Send />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={t("editMessage")}>
          <IconButton size="sm" onClick={onEdit}>
            <Edit />
          </IconButton>
        </Tooltip>
      )}
    </div>
  );
}

function AiMessageOptions({
  messageContentRef,
  content,
  onRegenerate,
}: {
  messageContentRef: RefObject<HTMLDivElement>;
  content: string;
  onRegenerate: () => void;
}) {
  const { t } = useTranslation();
  const copy = useCopySafe();

  return (
    <div className="flex flex-row items-center gap-2 opacity-0 transition-all group-hover:opacity-100">
      <Tooltip
        variant="outlined"
        title={
          <ButtonGroup orientation="vertical" variant="plain">
            <Button
              onClick={() => {
                copy(content);
              }}
            >
              {t("copyMarkdown")}
            </Button>
            <Button
              onClick={() => {
                copy(messageContentRef.current?.innerText ?? "");
              }}
            >
              {t("copyText")}
            </Button>
          </ButtonGroup>
        }
      >
        <IconButton
          size="sm"
          onClick={() => {
            copy(
              messageContentRef.current?.innerHTML ?? "",
              messageContentRef.current?.innerText ?? "",
            );
          }}
        >
          <ContentCopy />
        </IconButton>
      </Tooltip>
      <Tooltip title={t("regenerate")}>
        <IconButton size="sm" onClick={onRegenerate}>
          <Replay />
        </IconButton>
      </Tooltip>
    </div>
  );
}
