import { Close } from "@mui/icons-material";
import { Typography, IconButton, useTheme, Link } from "@mui/joy";
import { t } from "i18next";
import { useMemo, useState } from "react";
import { twMerge } from "tailwind-merge";
import { LLM_META, type LlmName } from "@backend/ai/llmMeta";
import { calculateMessageCreditUsage } from "@backend/util/credits/calculateMessageCreditUsage";
import { estimateTokens } from "@shared/util/estimateTokens";
import { useChat, useEnabledModels } from "../../../lib/api/rust";
import type { AttachedDocument } from "./ChatInput";
import { useParams } from "../../../router";
import { toast } from "react-toastify";

/* dynamic translation keys
t("warnings.messageCreditThreshold")
t("warnings.chatCreditThreshold")
*/

// Based on deep data analysis of the users' credit spending on a single chat, we have determined that the following thresholds are optimal for the user experience.
const CHAT_CREDIT_WARNING_THRESHOLD = 50;
const MESSAGE_CREDIT_WARNING_THRESHOLD = 10;

enum WarningCategory {
  MESSAGE_CREDIT_WARNING = "messageCreditThreshold",
  CHAT_CREDIT_WARNING = "chatCreditThreshold",
}

interface CheaperModel {
  name: LlmName;
  price: number;
}

interface CreditWarning {
  show: boolean;
  category: WarningCategory | null;
}

export function WarningMessage({
  attachedDocuments,
  setModelOverride,
  model,
  input,
  messageCreditWarningAccepted,
  setMessageCreditWarningAccepted,
  chatTokens = 0,
}: {
  attachedDocuments: AttachedDocument[];
  input: string;
  setModelOverride: (model: LlmName) => void;
  model: LlmName;
  messageCreditWarningAccepted: boolean;
  setMessageCreditWarningAccepted: (value: boolean) => void;
  chatTokens?: number;
}) {
  const params = useParams("/:organizationId/chats/:chatId");
  const chatId = params.chatId;

  const { data: chat } = useChat(chatId ?? "");
  const chatCreditWarningAccepted = chat?.creditWarningAccepted ?? false;
  const acceptChatCreditWarning = { mutateAsync: async () => {} };

  const [warning, setWarning] = useState<CreditWarning>({
    show: false, // The warning should be shown.
    category: null,
  });

  const warningColor = useTheme().palette.warning[200];

  const { data: enabledModels } = useEnabledModels();

  // Rough estimation (~4 chars per token)
  const inputTokens = estimateTokens(input);
  const documentTokens = attachedDocuments.reduce(
    (acc, doc) => acc + doc.tokens,
    0,
  );

  const messageTokens = inputTokens + documentTokens;

  const currentMessageCredits = calculateMessageCreditUsage({
    inputTokens: messageTokens,
    outputTokens: 0,
    model,
  }).totalCost;

  const currentChatCredits = calculateMessageCreditUsage({
    inputTokens: chatTokens,
    outputTokens: 0,
    model,
  }).totalCost;

  const cheaperModel = useMemo(() => {
    let category = warning.category;
    if (
      !messageCreditWarningAccepted &&
      currentMessageCredits > MESSAGE_CREDIT_WARNING_THRESHOLD
    ) {
      setWarning({
        show: true,
        category: WarningCategory.MESSAGE_CREDIT_WARNING,
      });
      category = WarningCategory.MESSAGE_CREDIT_WARNING;
    } else if (
      !chatCreditWarningAccepted &&
      !messageCreditWarningAccepted &&
      currentChatCredits > CHAT_CREDIT_WARNING_THRESHOLD
    ) {
      setWarning({
        show: true,
        category: WarningCategory.CHAT_CREDIT_WARNING,
      });
      category = WarningCategory.CHAT_CREDIT_WARNING;
    } else {
      setWarning((prev) => ({
        ...prev,
        show: false,
      }));
    }

    return enabledModels?.reduce((acc: CheaperModel | null, key) => {
      if (!LLM_META[key]?.allowChat || key === model) {
        return acc;
      }
      const warningTokens =
        category == WarningCategory.CHAT_CREDIT_WARNING
          ? chatTokens
          : inputTokens + documentTokens;

      const warningThreshold =
        category === WarningCategory.CHAT_CREDIT_WARNING
          ? CHAT_CREDIT_WARNING_THRESHOLD
          : MESSAGE_CREDIT_WARNING_THRESHOLD;

      const alternativePrice = calculateMessageCreditUsage({
        inputTokens: warningTokens,
        outputTokens: 0,
        model: key,
      }).totalCost;

      // We pick the most expensive model that doesn't cross the credit threshold and exceed the context window
      return alternativePrice < warningThreshold &&
        alternativePrice > (acc?.price ?? 0) &&
        messageTokens + chatTokens < LLM_META[key].contextWindow
        ? { name: key, price: alternativePrice }
        : acc;
    }, null);
  }, [
    chatCreditWarningAccepted,
    chatTokens,
    currentChatCredits,
    currentMessageCredits,
    documentTokens,
    enabledModels,
    inputTokens,
    messageCreditWarningAccepted,
    messageTokens,
    model,
    warning.category,
  ]);

  const switchToCheaperModel = () => {
    if (cheaperModel?.name) {
      setModelOverride(cheaperModel.name);
      const modelName = LLM_META[cheaperModel.name]?.name ?? cheaperModel.name;
      toast.success(t("switchedToModel", { model: modelName }));

      //close the warning
      setWarning((prev) => ({
        ...prev,
        show: false,
      }));
    }
  };

  const categoryMapping: Record<WarningCategory, number> = {
    [WarningCategory.MESSAGE_CREDIT_WARNING]: currentMessageCredits,
    [WarningCategory.CHAT_CREDIT_WARNING]: currentChatCredits,
  };

  const warningCredits = warning.category ? Math.round(categoryMapping[warning.category]) : 0;

  const acceptWarning = () => {
    if (warning.category === WarningCategory.MESSAGE_CREDIT_WARNING) {
      setMessageCreditWarningAccepted(true);
      setWarning((prev) => ({
        ...prev,
        show: false,
      }));
    } else if (warning.category === WarningCategory.CHAT_CREDIT_WARNING) {
      void acceptChatCreditWarning.mutateAsync();

      setWarning((prev) => ({
        ...prev,
        show: false,
      }));
    }
  };

  if (!warning.show || !warning.category) {
    return null;
  }

  return (
    <div
      className={twMerge(
        "mx-auto flex w-[99%] items-center justify-between rounded-t-lg px-4 py-1",
      )}
      style={{
        minWidth: "240px",
        backgroundColor: warningColor,
      }}
    >
      <Typography textAlign="center" level="body-sm">
        <div>
          <Typography level="title-sm">{t("tip")}:</Typography>{" "}
          {warning.category && t("warnings." + warning.category, {
            credits: warningCredits,
          })}
          {cheaperModel ? (
            <>
              {" "}
              <Link onClick={switchToCheaperModel}>
                {t("warnings.cheaperModel")}
              </Link>
            </>
          ) : null}
        </div>
      </Typography>
      <IconButton size="sm" color="warning" onClick={acceptWarning}>
        <Close sx={{ fontSize: "18px" }} />
      </IconButton>
    </div>
  );
}
