import { Close, ContentCopy, SwapHoriz } from "@mui/icons-material";
import { Box, IconButton, Option, Select, Textarea, Typography } from "@mui/joy";
import type { ReactNode } from "react";
import { TARGET_LANGUAGES, TRANSLATE_LANGUAGES } from "../../lib/translate/languages";
import { useTranslation } from "../../lib/i18n";
import { PdfEmbed } from "./PdfEmbed";

const panelFont = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;

const selectSx = {
  minWidth: 0,
  width: "100%",
  borderRadius: "8px",
  border: "1px solid #e5e5e5",
  bgcolor: "transparent",
  fontFamily: panelFont,
} as const;

const shellSx = {
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  border: "1px solid #e5e5e5",
  borderRadius: "12px",
  overflow: "hidden",
  bgcolor: "#ffffff",
} as const;

const scrollableDocumentSx = {
  flex: 1,
  minHeight: 0,
  overflow: "auto",
  px: 2.5,
  py: 2,
  fontFamily: panelFont,
  fontSize: "0.95rem",
  lineHeight: 1.6,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
} as const;

type TranslationPanelsProps = {
  sourceLang: string;
  targetLang: string;
  onSourceLang: (lang: string) => void;
  onTargetLang: (lang: string) => void;
  onSwap: () => void;
  sourceText: string;
  onSourceTextChange?: (text: string) => void;
  targetText: string;
  isPending: boolean;
  maxChars?: number;
  onClearSource?: () => void;
  onCopyTarget?: () => void;
  pdfPreviewUrl?: string | null;
  translatedPdfPreviewUrl?: string | null;
  pdfFileName?: string | null;
  translatedFileName?: string | null;
  progressLabel?: string | null;
};

export function TranslationPanels({
  sourceLang,
  targetLang,
  onSourceLang,
  onTargetLang,
  onSwap,
  sourceText,
  onSourceTextChange,
  targetText,
  isPending,
  maxChars,
  onClearSource,
  onCopyTarget,
  pdfPreviewUrl,
  translatedPdfPreviewUrl,
  pdfFileName,
  translatedFileName,
  progressLabel,
}: TranslationPanelsProps) {
  const { t } = useTranslation();
  const editable = Boolean(onSourceTextChange);

  const leftPanel = pdfPreviewUrl ? (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f4f4f5",
      }}
    >
      {pdfFileName && (
        <Typography
          level="body-xs"
          textColor="neutral.500"
          sx={{ px: 2, py: 1, borderBottom: "1px solid #ececf1", flexShrink: 0 }}
        >
          {pdfFileName}
        </Typography>
      )}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <PdfEmbed url={pdfPreviewUrl} title={pdfFileName ?? "PDF preview"} />
      </Box>
    </Box>
  ) : editable ? (
    <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
      <Textarea
        placeholder={t("translator.sourcePlaceholder")}
        value={sourceText}
        onChange={(e) => onSourceTextChange?.(e.target.value)}
        sx={{
          flex: 1,
          minHeight: 0,
          border: "none",
          borderRadius: 0,
          fontFamily: panelFont,
          "--Textarea-focusedHighlight": "transparent",
          "--Textarea-focusedThickness": "0px",
          bgcolor: "transparent",
          boxShadow: "none",
          "& textarea": {
            height: "100%",
            minHeight: "100%",
            resize: "none",
            overflow: "auto !important",
            fontSize: "0.95rem",
            lineHeight: 1.6,
          },
        }}
      />
    </Box>
  ) : (
    <Box
      sx={{
        ...scrollableDocumentSx,
        color: "#0d0d0d",
      }}
    >
      {sourceText || (
        <Typography level="body-sm" textColor="neutral.500">
          {t("translator.sourcePlaceholder")}
        </Typography>
      )}
    </Box>
  );

  const rightPanel = translatedPdfPreviewUrl ? (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
        bgcolor: "#f4f4f5",
      }}
    >
      {translatedFileName && (
        <Typography
          level="body-xs"
          textColor="neutral.500"
          sx={{ px: 2, py: 1, borderBottom: "1px solid #ececf1", flexShrink: 0 }}
        >
          {translatedFileName}
        </Typography>
      )}
      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <PdfEmbed
          url={translatedPdfPreviewUrl}
          title={translatedFileName ?? "Translated PDF"}
        />
      </Box>
    </Box>
  ) : (
    <Box
      sx={{
        ...scrollableDocumentSx,
        color: isPending && !targetText ? "#9b9b9b" : "#0d0d0d",
      }}
    >
      {isPending && !targetText
        ? (progressLabel ?? t("translator.translating"))
        : targetText || (
            <Typography component="span" level="body-sm" textColor="neutral.500">
              {t("translator.targetPlaceholder")}
            </Typography>
          )}
    </Box>
  );

  return (
    <Box sx={shellSx}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", lg: "1fr auto 1fr" },
          alignItems: "center",
          gap: 1,
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #ececf1",
          flexShrink: 0,
        }}
      >
        <Select
          size="sm"
          value={sourceLang}
          onChange={(_e, v) => v && onSourceLang(v)}
          sx={{ ...selectSx, minWidth: 0 }}
        >
          {TRANSLATE_LANGUAGES.map((lang) => (
            <Option key={lang.code} value={lang.code}>
              {t(lang.labelKey)}
            </Option>
          ))}
        </Select>
        <IconButton
          size="sm"
          variant="outlined"
          onClick={onSwap}
          sx={{ borderColor: "#e5e5e5", borderRadius: "8px", justifySelf: "center" }}
        >
          <SwapHoriz />
        </IconButton>
        <Select
          size="sm"
          value={targetLang}
          onChange={(_e, v) => v && onTargetLang(v)}
          sx={{ ...selectSx, minWidth: 0 }}
        >
          {TARGET_LANGUAGES.map((lang) => (
            <Option key={lang.code} value={lang.code}>
              {t(lang.labelKey)}
            </Option>
          ))}
        </Select>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
          flex: 1,
          minHeight: 0,
        }}
      >
        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            borderRight: { lg: "1px solid #ececf1" },
            borderBottom: { xs: "1px solid #ececf1", lg: "none" },
          }}
        >
          {leftPanel}
          <PanelFooter>
            {maxChars != null ? (
              <Typography level="body-xs" textColor="neutral.500">
                {sourceText.length.toLocaleString()} / {maxChars.toLocaleString()}
              </Typography>
            ) : pdfPreviewUrl ? (
              <Typography level="body-xs" textColor="neutral.500">
                {t("translator.pdfSourceHint")}
              </Typography>
            ) : (
              <span />
            )}
            {onClearSource && (
              <IconButton
                size="sm"
                variant="plain"
                disabled={!sourceText && !pdfPreviewUrl}
                onClick={onClearSource}
              >
                <Close fontSize="small" />
              </IconButton>
            )}
          </PanelFooter>
        </Box>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {rightPanel}
          <PanelFooter>
            <Typography
              level="body-xs"
              textColor="neutral.500"
              sx={{ fontStyle: "italic" }}
            >
              {pdfPreviewUrl || translatedPdfPreviewUrl
                ? t("translator.pdfTranslationHint")
                : t("translator.alternativesHint")}
            </Typography>
            {onCopyTarget && (
              <IconButton
                size="sm"
                variant="plain"
                disabled={!targetText}
                onClick={onCopyTarget}
              >
                <ContentCopy fontSize="small" />
              </IconButton>
            )}
          </PanelFooter>
        </Box>
      </Box>
    </Box>
  );
}

function PanelFooter({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        px: 2,
        py: 1,
        flexShrink: 0,
        borderTop: "1px solid #ececf1",
      }}
    >
      {children}
    </Box>
  );
}
