import { isTauri } from "@tauri-apps/api/core";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";

export async function checkForAppUpdate(): Promise<Update | null> {
  if (!isTauri()) return null;
  try {
    return (await check()) ?? null;
  } catch (err) {
    console.warn("Update check failed:", err);
    return null;
  }
}

export async function downloadAndInstallUpdate(update: Update): Promise<void> {
  let downloaded = 0;
  let contentLength = 0;

  await update.downloadAndInstall((event) => {
    if (event.event === "Started") {
      contentLength = event.data.contentLength ?? 0;
    } else if (event.event === "Progress") {
      downloaded += event.data.chunkLength;
    }
    if (contentLength > 0) {
      const pct = Math.round((downloaded / contentLength) * 100);
      console.debug(`Update download: ${pct}%`);
    }
  });

  await relaunch();
}
