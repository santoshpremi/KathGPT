import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { Button, Typography } from "@mui/joy";
import { ChatInterface } from "../components/chat/ChatInterface";
import { useDraftChatStore } from "../lib/context/draftChatStore";
import { isTauriApp } from "../lib/api/rust/init";
import { useTranslation } from "../lib/i18n";
import { getQuickComposeShortcutLabel } from "../lib/tauri/quickCompose";

function useQuickComposeSession() {
  const [chatId, setChatId] = useState(() => uuidv4());
  const markDraft = useDraftChatStore((s) => s.markDraft);
  const clearDraft = useDraftChatStore((s) => s.clearDraft);

  const resetSession = useCallback(() => {
    setChatId((previous) => {
      clearDraft(previous);
      return uuidv4();
    });
  }, [clearDraft]);

  useEffect(() => {
    markDraft(chatId);
  }, [chatId, markDraft]);

  useEffect(() => {
    if (!isTauriApp()) return;
    let unlisten: (() => void) | undefined;
    void listen("quick-compose-show", () => {
      resetSession();
    }).then((fn) => {
      unlisten = fn;
    });
    return () => unlisten?.();
  }, [resetSession]);

  return { chatId };
}

export default function QuickComposePage() {
  const { t } = useTranslation();
  const { chatId } = useQuickComposeSession();

  useEffect(() => {
    if (!isTauriApp()) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        void invoke("hide_quick_compose");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const openInMain = () => {
    void invoke("open_chat_in_main", { chatId });
  };

  return (
    <div className="flex h-screen flex-col bg-white">
      <header className="flex items-center justify-between border-b border-stone-200 px-4 py-2.5">
        <div>
          <Typography level="title-sm">{t("quickCompose.title")}</Typography>
          <Typography level="body-xs" textColor="neutral.500">
            {getQuickComposeShortcutLabel()}
          </Typography>
        </div>
        <Button size="sm" variant="soft" color="neutral" onClick={openInMain}>
          {t("quickCompose.openInApp")}
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-hidden px-3 pb-2 pt-2">
        <ChatInterface
          key={chatId}
          chatId={chatId}
          embedded
          showSmartIterations={false}
          showAttachmentButton={false}
        />
      </div>
      <Typography
        level="body-xs"
        className="px-4 pb-3 text-center text-stone-400"
      >
        {t("quickCompose.hint")}
      </Typography>
    </div>
  );
}
