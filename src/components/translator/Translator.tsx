import { Translate } from "@mui/icons-material";
import {
  Box,
  Button,
  Option,
  Select,
  Tab,
  TabList,
  Tabs,
  Typography,
} from "@mui/joy";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useTranslateText } from "../../lib/api/rust/hooks/useTranslate";
import { useProviderKeyStatus } from "../../lib/api/rust";
import { useTranslation } from "../../lib/i18n";
import { useCopySafe } from "../../lib/hooks/useCopySafe";
import { useModals } from "../../router";
import { useToolSessionSync } from "../../lib/hooks/useToolSessionSync";
import {
  archiveTranslatorSession,
  translatorEntryFingerprint,
  translatorSessionFingerprint,
  translatorSessionHasContent,
} from "../../lib/tools/archiveToolSession";
import { historyDisplayName } from "../../lib/tools/historyStorage";
import {
  deleteTranslatorHistoryEntry,
  loadTranslatorHistory,
  renameTranslatorHistoryEntry,
  type TranslatorHistoryEntry,
} from "../../lib/tools/translatorHistory";
import { useToolSessionStore } from "../../lib/tools/toolSessionStore";
import { ToolHistoryDrawer } from "../tools/ToolHistoryDrawer";
import { ToolPageHeader } from "../tools/ToolPageHeader";
import { FileTranslationWorkspace } from "./FileTranslationWorkspace";
import { TranslationPanels } from "./TranslationPanels";

const MAX_CHARS = 50_000;
const DEBOUNCE_MS = 700;

const panelFont = `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif`;

const selectSx = {
  minWidth: 0,
  borderRadius: "8px",
  border: "1px solid #e5e5e5",
  bgcolor: "transparent",
  fontFamily: panelFont,
} as const;

const tabsSx = {
  flexShrink: 0,
  bgcolor: "transparent",
  "& .Mui-selected": { color: "#0d0d0d !important" },
  "& .MuiTab-indicator": { bgcolor: "#0d0d0d" },
} as const;

export function Translator() {
  const { t } = useTranslation();
  const modals = useModals();
  const copy = useCopySafe();
  const { data: keyStatus } = useProviderKeyStatus();
  const { mutateAsync: translate, isPending } = useTranslateText();

  const stored = useToolSessionStore.getState().translator;
  const [tab, setTab] = useState(stored?.tab ?? 0);
  const [sourceLang, setSourceLang] = useState(stored?.sourceLang ?? "auto");
  const [targetLang, setTargetLang] = useState(stored?.targetLang ?? "en");
  const [sourceText, setSourceText] = useState(stored?.sourceText ?? "");
  const [targetText, setTargetText] = useState(stored?.targetText ?? "");
  const [history, setHistory] = useState<TranslatorHistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string | null>(
    stored?.activeTabId ?? null,
  );
  const translatorSession = useMemo(
    () => ({
      tab,
      sourceLang,
      targetLang,
      sourceText,
      targetText,
      activeTabId,
    }),
    [tab, sourceLang, targetLang, sourceText, targetText, activeTabId],
  );

  const sessionFingerprint = useMemo(
    () => translatorSessionFingerprint(translatorSession),
    [translatorSession],
  );

  useToolSessionSync(
    "translator",
    translatorSession,
    translatorSessionHasContent(translatorSession),
    sessionFingerprint,
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setHistory(loadTranslatorHistory());
  }, []);

  const hasProvider = Boolean(
    keyStatus?.some((k) => k.configured && (k.id === "openrouter" || k.id === "openai")),
  );

  const runTranslate = useCallback(
    async (text: string) => {
      if (!text.trim() || !hasProvider) return;
      try {
        const result = await translate({
          text,
          sourceLanguage: sourceLang === "auto" ? undefined : sourceLang,
          targetLanguage: targetLang,
        });
        setTargetText(result.translatedText);
      } catch (e) {
        console.error(e);
        toast.error(
          e instanceof Error ? e.message : t("translator.translateFailed"),
        );
      }
    },
    [hasProvider, sourceLang, targetLang, translate, t],
  );

  useEffect(() => {
    if (tab !== 0) return;
    if (!sourceText.trim()) {
      setTargetText("");
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void runTranslate(sourceText);
    }, DEBOUNCE_MS);
    return () => clearTimeout(debounceRef.current);
  }, [tab, sourceText, sourceLang, targetLang, runTranslate]);

  const swapLanguages = () => {
    if (sourceLang === "auto") {
      setSourceLang(targetLang);
      setTargetLang("en");
    } else {
      const prevSource = sourceLang;
      setSourceLang(targetLang);
      setTargetLang(prevSource);
    }
    if (targetText.trim()) {
      setSourceText(targetText);
      setTargetText(sourceText);
    }
  };

  const historyItems = useMemo(
    () =>
      history.map((entry) => ({
        id: entry.id,
        title: historyDisplayName(
          entry.name,
          entry.sourceText,
          t("toolHistory.untitled"),
        ),
        createdAt: entry.createdAt,
      })),
    [history, t],
  );

  const resetTab = () => {
    setSourceText("");
    setTargetText("");
    setSourceLang("auto");
    setTargetLang("en");
    setTab(0);
    setActiveTabId(null);
    useToolSessionStore.getState().resetTranslator();
  };

  const handleNewTab = () => {
    const saved = Boolean(archiveTranslatorSession(translatorSession));
    resetTab();
    if (saved) {
      setHistory(loadTranslatorHistory());
      toast.success(t("toolHistory.saved"));
    }
  };

  const handleHistorySelect = (id: string) => {
    const entry = history.find((e) => e.id === id);
    if (!entry) return;
    setSourceLang(entry.sourceLang);
    setTargetLang(entry.targetLang);
    setSourceText(entry.sourceText);
    setTargetText(entry.targetText);
    setTab(0);
    setActiveTabId(entry.id);
    const store = useToolSessionStore.getState();
    store.setTranslatorBaseline(translatorEntryFingerprint(entry));
    store.setTranslatorDirty(false);
    setHistoryOpen(false);
  };

  const handleHistoryRename = (id: string, name: string) => {
    setHistory(renameTranslatorHistoryEntry(id, name));
  };

  const handleHistoryDelete = (id: string) => {
    setHistory(deleteTranslatorHistoryEntry(id));
    if (activeTabId === id) setActiveTabId(null);
    toast.success(t("toolHistory.deleted"));
  };

  if (!hasProvider) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-8">
        <Translate sx={{ fontSize: 48, color: "#9b9b9b" }} />
        <Typography level="h4" sx={{ fontFamily: panelFont }}>
          {t("translator.title")}
        </Typography>
        <Typography
          level="body-md"
          textAlign="center"
          sx={{ maxWidth: 420, fontFamily: panelFont }}
        >
          {t("translator.noApiKey")}
        </Typography>
        <Button
          onClick={() => modals.open("/apiKeys")}
          sx={{ bgcolor: "#0d0d0d", "&:hover": { bgcolor: "#353740" } }}
        >
          {t("apiKeysModal.title")}
        </Button>
      </div>
    );
  }

  return (
    <div
      className="flex h-full min-h-0 w-full flex-col"
      style={{ fontFamily: panelFont }}
    >
      <ToolPageHeader
        icon={<Translate sx={{ fontSize: 22 }} />}
        title={t("translator.title")}
        onNewTab={handleNewTab}
        onOpenHistory={() => setHistoryOpen(true)}
        trailing={
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography level="body-sm" textColor="neutral.500">
              {t("translator.glossary")}
            </Typography>
            <Select size="sm" value="none" disabled sx={{ ...selectSx, width: 120 }}>
              <Option value="none">{t("translator.glossaryNone")}</Option>
            </Select>
          </Box>
        }
      />
      <ToolHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        entries={historyItems}
        selectedId={activeTabId}
        onSelect={handleHistorySelect}
        onRename={handleHistoryRename}
        onDelete={handleHistoryDelete}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-6">
        <Tabs
          value={tab}
          onChange={(_e, v) => setTab(v as number)}
          sx={tabsSx}
        >
          <TabList sx={{ mb: 2, gap: 2 }}>
            <Tab sx={{ fontFamily: panelFont, fontWeight: 500 }}>
              {t("translator.translateText")}
            </Tab>
            <Tab sx={{ fontFamily: panelFont, fontWeight: 500 }}>
              {t("translator.translateFile")}
            </Tab>
          </TabList>
        </Tabs>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {tab === 0 ? (
            <TranslationPanels
              sourceLang={sourceLang}
              targetLang={targetLang}
              onSourceLang={setSourceLang}
              onTargetLang={setTargetLang}
              onSwap={swapLanguages}
              sourceText={sourceText}
              onSourceTextChange={(text) =>
                setSourceText(text.slice(0, MAX_CHARS))
              }
              targetText={targetText}
              isPending={isPending}
              maxChars={MAX_CHARS}
              onClearSource={() => {
                setSourceText("");
                setTargetText("");
              }}
              onCopyTarget={() => copy(targetText)}
            />
          ) : (
            <FileTranslationWorkspace
              sourceLang={sourceLang}
              targetLang={targetLang}
              onSourceLang={setSourceLang}
              onTargetLang={setTargetLang}
              onSwap={swapLanguages}
            />
          )}
        </Box>
      </div>
    </div>
  );
}
