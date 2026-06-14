import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { checkForAppUpdate, downloadAndInstallUpdate } from "../../lib/tauri/update";

const CHECK_DELAY_MS = 8_000;

/**
 * Desktop only: checks GitHub Releases for a signed update after startup.
 * Skipped in web dev mode and debug builds without updater artifacts.
 */
export function AppUpdateChecker() {
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    const timer = window.setTimeout(() => {
      void (async () => {
        const update = await checkForAppUpdate();
        if (!update) return;

        const version = update.version;
        const toastId = `app-update-${version}`;

        toast.info(
          ({ closeToast }) => (
            <div className="flex flex-col gap-2">
              <p className="font-medium">Update available — v{version}</p>
              <p className="text-sm opacity-90">
                A new version of KathaGPT is ready to install.
              </p>
              <div className="mt-1 flex gap-2">
                <button
                  type="button"
                  className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
                  onClick={() => {
                    closeToast?.();
                    void toast.promise(
                      downloadAndInstallUpdate(update),
                      {
                        pending: "Downloading update…",
                        success: "Restarting…",
                        error: "Update failed — try downloading from the website.",
                      },
                    );
                  }}
                >
                  Update & restart
                </button>
                <button
                  type="button"
                  className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100"
                  onClick={() => closeToast?.()}
                >
                  Later
                </button>
              </div>
            </div>
          ),
          {
            toastId,
            autoClose: false,
            closeOnClick: false,
          },
        );
      })();
    }, CHECK_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  return null;
}
