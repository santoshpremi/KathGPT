import { invoke } from "@tauri-apps/api/core";

const WEB_API_BASE = "/api/local";
const POLL_MS = 100;
const MAX_WAIT_MS = 30_000;

let apiBase = WEB_API_BASE;

export function isTauriApp(): boolean {
  return (
    typeof window !== "undefined" &&
    ("__TAURI_INTERNALS__" in window || "__TAURI__" in window)
  );
}

export function getRustApiBase(): string {
  return apiBase;
}

/** Re-resolve the embedded API port (Tauri) before each request. */
export async function ensureRustApiReady(): Promise<void> {
  if (!isTauriApp()) {
    return;
  }

  try {
    const port = await invoke<number>("get_api_port");
    if (port > 0) {
      apiBase = `http://127.0.0.1:${port}/api/local`;
      return;
    }
  } catch {
    // Fall through to full init.
  }

  await initRustApiClient();
}

/** Resolve API base URL before the React tree mounts (desktop vs browser). */
export async function initRustApiClient(): Promise<void> {
  if (!isTauriApp()) {
    apiBase = WEB_API_BASE;
    return;
  }

  const port = await waitForApiPort();
  apiBase = `http://127.0.0.1:${port}/api/local`;
}

async function waitForApiPort(): Promise<number> {
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    try {
      const port = await invoke<number>("get_api_port");
      if (port > 0) {
        return port;
      }
    } catch {
      // Backend still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  }

  throw new Error(
    "KathGPT local API did not start. Quit other dev servers and reopen the app.",
  );
}
