import { useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useNavigate } from "../../router";
import { DEV_ORG_ID } from "../../lib/local/seed";
import { isTauriApp } from "../../lib/api/rust/init";
import { isQuickComposeEnabled } from "../../lib/tauri/quickCompose";

/** Opens a chat in the main window when quick-compose sends the user here. */
export function QuickComposeBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isTauriApp()) {
      return;
    }

    void invoke("sync_quick_compose_enabled", {
      enabled: isQuickComposeEnabled(),
    });

    let cancelled = false;
    let unlisten: (() => void) | undefined;

    void listen<string>("open-chat", (event) => {
      if (cancelled || !event.payload) {
        return;
      }
      void navigate("/:organizationId/chats/:chatId", {
        params: { organizationId: DEV_ORG_ID, chatId: event.payload },
      });
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [navigate]);

  return null;
}
