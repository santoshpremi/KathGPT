import { Download, Translate, UploadFile } from "@mui/icons-material";
import { Box, Button, CircularProgress, Typography } from "@mui/joy";
import { useCallback, useState } from "react";
import { toast } from "react-toastify";
import {
  base64ToBlob,
  createFilePreviewUrl,
  downloadTranslatedFile,
  previewUrlFromId,
  translateFile,
  type TranslatedFileResult,
} from "../../lib/api/rust/translateFile";
import { isSupportedTranslationFile, readTranslationFile } from "../../lib/translate/readTranslationFile";
import { useTranslation } from "../../lib/i18n";
import { TranslationPanels } from "./TranslationPanels";

const panelFont = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;

type FileTranslationWorkspaceProps = {
  sourceLang: string;
  targetLang: string;
  onSourceLang: (lang: string) => void;
  onTargetLang: (lang: string) => void;
  onSwap: () => void;
};

export function FileTranslationWorkspace({
  sourceLang,
  targetLang,
  onSourceLang,
  onTargetLang,
  onSwap,
}: FileTranslationWorkspaceProps) {
  const { t } = useTranslation();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [sourcePreviewUrl, setSourcePreviewUrl] = useState<string | null>(null);
  const [translatedPreviewUrl, setTranslatedPreviewUrl] = useState<string | null>(
    null,
  );
  const [translatedResult, setTranslatedResult] =
    useState<TranslatedFileResult | null>(null);
  const [sourcePreviewText, setSourcePreviewText] = useState("");
  const [translatedPreviewText, setTranslatedPreviewText] = useState("");
  const [translating, setTranslating] = useState(false);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);

  const isPdf = Boolean(uploadedFile?.name.match(/\.pdf$/i));

  const clearFile = useCallback(() => {
    setSourcePreviewUrl(null);
    setTranslatedPreviewUrl(null);
    setUploadedFile(null);
    setTranslatedResult(null);
    setSourcePreviewText("");
    setTranslatedPreviewText("");
    setProgressLabel(null);
    setSavedPath(null);
  }, []);

  const onFileSelect = (file: File) => {
    if (!isSupportedTranslationFile(file.name)) {
      toast.error(t("translator.unsupportedFile"));
      return;
    }
    void (async () => {
      try {
        clearFile();
        setUploadedFile(file);
        if (/\.pdf$/i.test(file.name)) {
          setSourcePreviewUrl(await createFilePreviewUrl(file));
          setSourcePreviewText("");
        } else {
          const text = await readTranslationFile(file);
          setSourcePreviewText(text);
        }
      } catch (e) {
        console.error(e);
        toast.error(
          e instanceof Error ? e.message : t("translator.fileReadFailed"),
        );
      }
    })();
  };

  const runFileTranslate = async () => {
    if (!uploadedFile) return;
    setTranslating(true);
    setTranslatedResult(null);
    setTranslatedPreviewText("");
    setTranslatedPreviewUrl(null);
    setProgressLabel(t("translator.translatingFile"));

    try {
      const result = await translateFile({
        file: uploadedFile,
        sourceLanguage: sourceLang === "auto" ? undefined : sourceLang,
        targetLanguage: targetLang,
      });
      setTranslatedResult(result);
      setSavedPath(null);
      const blob = base64ToBlob(result.data, result.mimeType);
      if (/\.pdf$/i.test(result.filename)) {
        if (result.previewId) {
          setTranslatedPreviewUrl(await previewUrlFromId(result.previewId));
        } else {
          setTranslatedPreviewUrl(await createFilePreviewUrl(
            new File([blob], result.filename, { type: result.mimeType }),
          ));
        }
      } else {
        setTranslatedPreviewText(await blob.text());
      }
      toast.success(t("translator.fileTranslated"));
    } catch (e) {
      console.error(e);
      toast.error(
        e instanceof Error ? e.message : t("translator.translateFailed"),
      );
    } finally {
      setTranslating(false);
      setProgressLabel(null);
    }
  };

  if (!uploadedFile) {
    return (
      <Box
        sx={{
          border: "1px dashed #d4d4d4",
          borderRadius: "12px",
          p: 4,
          textAlign: "center",
          bgcolor: "#fafafa",
          flex: 1,
          minHeight: 360,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <UploadFile sx={{ fontSize: 40, color: "#9b9b9b", mb: 1 }} />
        <Typography level="body-md" sx={{ mb: 1, fontFamily: panelFont }}>
          {t("translator.fileUploadHint")}
        </Typography>
        <Typography
          level="body-sm"
          textColor="neutral.500"
          sx={{ mb: 2, fontFamily: panelFont }}
        >
          {t("translator.fileFormats")}
        </Typography>
        <Button
          component="label"
          variant="outlined"
          sx={{ borderColor: "#e5e5e5" }}
        >
          {t("translator.chooseFile")}
          <input
            type="file"
            hidden
            accept=".txt,.md,.csv,.pdf,text/plain,application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelect(file);
              e.target.value = "";
            }}
          />
        </Button>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        height: "100%",
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <Typography level="body-sm" textColor="neutral.600" sx={{ fontFamily: panelFont }}>
          {uploadedFile.name}
        </Typography>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            size="sm"
            variant="solid"
            disabled={translating}
            startDecorator={
              translating ? <CircularProgress size="sm" /> : <Translate />
            }
            onClick={() => void runFileTranslate()}
            sx={{ bgcolor: "#0d0d0d", "&:hover": { bgcolor: "#353740" } }}
          >
            {translating ? t("translator.translatingFile") : t("translator.translateFileAction")}
          </Button>
          <Button
            size="sm"
            variant="outlined"
            disabled={!translatedResult}
            startDecorator={<Download />}
            onClick={() => {
              if (!translatedResult) return;
              void (async () => {
                try {
                  const path = await downloadTranslatedFile(translatedResult);
                  if (path) {
                    setSavedPath(path);
                    toast.success(t("translator.savedTo", { path }));
                  }
                } catch (e) {
                  const message = e instanceof Error ? e.message : String(e);
                  if (!message.toLowerCase().includes("cancel")) {
                    toast.error(message);
                  }
                }
              })();
            }}
            sx={{ borderColor: "#e5e5e5" }}
          >
            {t("translator.saveTranslation")}
          </Button>
          <Button
            component="label"
            size="sm"
            variant="outlined"
            sx={{ borderColor: "#e5e5e5" }}
          >
            {t("translator.changeFile")}
            <input
              type="file"
              hidden
              accept=".txt,.md,.csv,.pdf,text/plain,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFileSelect(file);
                e.target.value = "";
              }}
            />
          </Button>
        </Box>
      </Box>

      {savedPath && (
        <Typography
          level="body-xs"
          textColor="success.600"
          sx={{ fontFamily: panelFont, flexShrink: 0 }}
        >
          {t("translator.savedTo", { path: savedPath })}
        </Typography>
      )}

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        <TranslationPanels
          sourceLang={sourceLang}
          targetLang={targetLang}
          onSourceLang={onSourceLang}
          onTargetLang={onTargetLang}
          onSwap={onSwap}
          sourceText={sourcePreviewText}
          targetText={translatedPreviewText}
          isPending={translating}
          progressLabel={progressLabel}
          pdfPreviewUrl={isPdf ? sourcePreviewUrl : null}
          translatedPdfPreviewUrl={isPdf ? translatedPreviewUrl : null}
          pdfFileName={uploadedFile.name}
          translatedFileName={translatedResult?.filename ?? null}
          onClearSource={clearFile}
        />
      </Box>
    </Box>
  );
}
