import { isTauri } from "@tauri-apps/api/core";

const QUICK_COMPOSE_ENABLED_KEY = "kathagpt_quick_compose_enabled";

export function getQuickComposeShortcutLabel(): string {
  const isMac =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/.test(navigator.platform);
  return isMac ? "⌘⇧Space" : "Ctrl+Shift+Space";
}

export function isQuickComposeEnabled(): boolean {
  if (typeof localStorage === "undefined") {
    return true;
  }
  return localStorage.getItem(QUICK_COMPOSE_ENABLED_KEY) !== "false";
}

export function setQuickComposeEnabled(enabled: boolean): void {
  localStorage.setItem(QUICK_COMPOSE_ENABLED_KEY, enabled ? "true" : "false");
}

export function isDesktopTauri(): boolean {
  return isTauri();
}
