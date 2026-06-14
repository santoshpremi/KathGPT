import { LinearProgress, Typography } from "@mui/joy";
import { twMerge } from "tailwind-merge";
import { useTranslation } from "../../../lib/i18n";
import {
  formatTokenCount,
  getContextWindow,
} from "../../../lib/util/contextWindow";
import { estimateTokens } from "@shared/util/estimateTokens";
import type { AttachedDocument } from "./ChatInput";

interface ContextTokenIndicatorProps {
  model: string | null | undefined;
  chatTokens: number;
  input: string;
  attachedDocuments: AttachedDocument[];
  className?: string;
}

export function ContextTokenIndicator({
  model,
  chatTokens,
  input,
  attachedDocuments,
  className,
}: ContextTokenIndicatorProps) {
  const { t } = useTranslation();
  const contextWindow = getContextWindow(model);
  const draftTokens =
    estimateTokens(input) +
    attachedDocuments.reduce((sum, doc) => sum + doc.tokens, 0);
  const usedTokens = chatTokens + draftTokens;
  const remaining = Math.max(0, contextWindow - usedTokens);
  const usageRatio = Math.min(1, usedTokens / contextWindow);
  const isNearLimit = usageRatio >= 0.85;
  const isOverLimit = usedTokens > contextWindow;

  return (
    <div
      className={twMerge(
        "flex w-full flex-col gap-1 px-1 pb-1",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Typography
          level="body-xs"
          textColor={isOverLimit ? "danger" : isNearLimit ? "warning" : "neutral.500"}
        >
          {isOverLimit
            ? t("contextTokens.overLimit", {
                used: formatTokenCount(usedTokens),
                limit: formatTokenCount(contextWindow),
              })
            : t("contextTokens.remaining", {
                remaining: formatTokenCount(remaining),
                used: formatTokenCount(usedTokens),
                limit: formatTokenCount(contextWindow),
              })}
        </Typography>
        <Typography level="body-xs" textColor="neutral.400">
          {Math.round(usageRatio * 100)}%
        </Typography>
      </div>
      <LinearProgress
        determinate
        value={usageRatio * 100}
        color={isOverLimit ? "danger" : isNearLimit ? "warning" : "neutral"}
        sx={{
          "--LinearProgress-radius": "999px",
          "--LinearProgress-thickness": "4px",
          bgcolor: "#ececf1",
        }}
      />
      {isNearLimit && !isOverLimit && (
        <Typography level="body-xs" textColor="warning">
          {t("contextTokens.nearLimitHint")}
        </Typography>
      )}
      {isOverLimit && (
        <Typography level="body-xs" textColor="danger">
          {t("contextTokens.overLimitHint")}
        </Typography>
      )}
    </div>
  );
}
