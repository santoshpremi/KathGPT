import { useEffect, useState } from "react";
import { assetUrl } from "../lib/site";
import {
  INSTALL_FILES,
  LINUX_CURL_INSTALL,
  LINUX_SMART_INSTALL,
  MAC_CURL_INSTALL,
  MAC_QUICK_FIX,
  MAC_SMART_INSTALL,
  WINDOWS_CURL_INSTALL,
  WINDOWS_SMART_INSTALL,
} from "../lib/install";

type CopyKey =
  | "curl"
  | "smart"
  | "quick"
  | "linux-curl"
  | "linux-smart"
  | "windows-curl"
  | "windows-smart";

export function InstallSetup() {
  const [copied, setCopied] = useState<CopyKey | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash.startsWith("install-")) {
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  const copy = async (text: string, key: CopyKey) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <section id="install-setup" className="border-b border-stone-200 bg-stone-50 py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label">Install Setup</p>
          <h2 className="section-title mt-3 md:text-5xl">
            Install KathaGPT in seconds
          </h2>
          <p className="section-body mt-4">
            Pick your platform below. On macOS, unsigned apps need a quarantine
            clear — both macOS options handle that automatically. On Windows,
            SmartScreen may warn for unsigned builds; use{" "}
            <strong className="text-stone-800">More info → Run anyway</strong>.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl space-y-6">

          {/* ── macOS: Option A — curl one-liner ───────────────────────── */}
          <div id="install-macos-arm" className="surface-card scroll-mt-24 p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                Option A
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                macOS · Recommended
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              One command — no download needed
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Detects your chip (Apple Silicon or Intel), downloads the right DMG to a
              temp folder, installs to <code className="rounded bg-stone-100 px-1 text-xs">/Applications</code>,
              clears quarantine, and opens the app.
            </p>
            <ol className="mt-4 list-inside list-decimal space-y-1.5 text-sm text-stone-600">
              <li>Open Terminal (Spotlight → type "Terminal").</li>
              <li>Paste the command below and press Enter.</li>
              <li>KathaGPT opens automatically when done.</li>
            </ol>
            <CopyBlock command={MAC_CURL_INSTALL} copyKey="curl" copied={copied} onCopy={copy} />
          </div>

          {/* ── macOS: Option B — already downloaded ───────────────────── */}
          <div id="install-macos-intel" className="surface-card scroll-mt-24 p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                Option B
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                macOS · Already downloaded the DMG?
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              Smart install from your download
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Works even if the file was saved to Downloads, Desktop, or
              anywhere else — and handles renamed copies like{" "}
              <code className="rounded bg-stone-100 px-1 text-xs">KathaGPT_…(2).dmg</code>.
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1.5 text-sm text-stone-600">
              <li>
                Supports{" "}
                <strong className="text-stone-800">{INSTALL_FILES["mac-arm"]}</strong>{" "}
                (Apple Silicon) and{" "}
                <strong className="text-stone-800">{INSTALL_FILES["mac-intel"]}</strong>{" "}
                (Intel) — picks the one it finds.
              </li>
              <li>Open Terminal, paste the command, press Enter.</li>
            </ul>
            <CopyBlock command={MAC_SMART_INSTALL} copyKey="smart" copied={copied} onCopy={copy} />
          </div>

          {/* ── macOS quick fix ────────────────────────────────────────── */}
          <div id="install-macos-fix" className="surface-card p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
              macOS · already in Applications?
            </p>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              Quick fix if the app won&apos;t open
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Or right-click{" "}
              <strong className="text-stone-800">KathaGPT.app</strong>{" "}
              in Applications →{" "}
              <strong className="text-stone-800">Open</strong> →{" "}
              <strong className="text-stone-800">Open</strong> again.
            </p>
            <CopyBlock command={MAC_QUICK_FIX} copyKey="quick" copied={copied} onCopy={copy} />
          </div>

          {/* ── Linux ──────────────────────────────────────────────────── */}
          <div id="install-linux" className="surface-card scroll-mt-24 p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                Option A
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                Linux · Recommended
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              One command — no download needed
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Downloads the AppImage, installs it to{" "}
              <code className="rounded bg-stone-100 px-1 text-xs">~/.local/bin</code>,
              creates a desktop entry, and launches KathaGPT.
            </p>
            <ol className="mt-4 list-inside list-decimal space-y-1.5 text-sm text-stone-600">
              <li>Open a terminal.</li>
              <li>Paste the command below and press Enter.</li>
              <li>KathaGPT launches automatically when done.</li>
            </ol>
            <CopyBlock command={LINUX_CURL_INSTALL} copyKey="linux-curl" copied={copied} onCopy={copy} />
          </div>

          <div className="surface-card scroll-mt-24 p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                Option B
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                Linux · Already downloaded the AppImage?
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              Smart install from your download
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Searches ~/Downloads, ~/Desktop, and ~ for any{" "}
              <code className="rounded bg-stone-100 px-1 text-xs">KathaGPT*.AppImage</code> —
              handles duplicates like{" "}
              <code className="rounded bg-stone-100 px-1 text-xs">(1).AppImage</code> and files
              saved to non-standard locations.
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1.5 text-sm text-stone-600">
              <li>
                Looking for{" "}
                <strong className="text-stone-800">{INSTALL_FILES.linux}</strong>.
              </li>
              <li>Open a terminal, paste the command, press Enter.</li>
            </ul>
            <CopyBlock command={LINUX_SMART_INSTALL} copyKey="linux-smart" copied={copied} onCopy={copy} />
          </div>

          {/* ── Windows ────────────────────────────────────────────────── */}
          <div id="install-windows" className="surface-card scroll-mt-24 p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-stone-900 px-2.5 py-0.5 text-xs font-semibold text-white">
                Option A
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                Windows · Recommended
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              One command — no browser download needed
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Downloads{" "}
              <code className="rounded bg-stone-100 px-1 text-xs">{INSTALL_FILES.windows}</code>{" "}
              and launches the NSIS installer.
            </p>
            <ol className="mt-4 list-inside list-decimal space-y-1.5 text-sm text-stone-600">
              <li>Open PowerShell (Start → type &quot;PowerShell&quot;).</li>
              <li>Paste the command below and press Enter.</li>
              <li>Follow the setup wizard, then open KathaGPT from the Start menu.</li>
            </ol>
            <CopyBlock command={WINDOWS_CURL_INSTALL} copyKey="windows-curl" copied={copied} onCopy={copy} />
          </div>

          <div className="surface-card scroll-mt-24 p-6">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                Option B
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                Windows · Already downloaded the installer?
              </span>
            </div>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              Smart install from your download
            </h3>
            <p className="mt-1 text-sm text-stone-600">
              Finds{" "}
              <code className="rounded bg-stone-100 px-1 text-xs">KathaGPT*.exe</code>{" "}
              or{" "}
              <code className="rounded bg-stone-100 px-1 text-xs">*.msi</code>{" "}
              in Downloads or Desktop — handles renamed copies.
            </p>
            <CopyBlock command={WINDOWS_SMART_INSTALL} copyKey="windows-smart" copied={copied} onCopy={copy} />
          </div>

          {/* ── first launch ───────────────────────────────────────────── */}
          <div className="surface-card p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
              Final step · First launch
            </p>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              Start chatting
            </h3>
            <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-stone-600">
              <li>
                Open KathaGPT from Applications (macOS), the Start menu (Windows),
                or your app launcher (Linux).
              </li>
              <li>
                <strong className="text-stone-800">Local models:</strong> use{" "}
                <strong className="text-stone-800">Add Local Model</strong> in the
                user menu — no API key required.
              </li>
              <li>
                <strong className="text-stone-800">Cloud models:</strong> go to{" "}
                <strong className="text-stone-800">Settings → API Keys</strong>{" "}
                and add OpenRouter (recommended), OpenAI, Anthropic, Google, or
                Perplexity.
              </li>
            </ol>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-stone-500">
          Prefer a standalone script?{" "}
          <a
            href={assetUrl("downloads/install-macos.sh")}
            download="install-macos.sh"
            className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-2 hover:decoration-stone-500"
          >
            install-macos.sh
          </a>{" "}
          ·{" "}
          <a
            href={assetUrl("downloads/install-linux.sh")}
            download="install-linux.sh"
            className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-2 hover:decoration-stone-500"
          >
            install-linux.sh
          </a>{" "}
          ·{" "}
          <a
            href={assetUrl("downloads/install-windows.ps1")}
            download="install-windows.ps1"
            className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-2 hover:decoration-stone-500"
          >
            install-windows.ps1
          </a>
        </p>
      </div>
    </section>
  );
}

function CopyBlock({
  command,
  copyKey,
  copied,
  onCopy,
}: {
  command: string;
  copyKey: CopyKey;
  copied: CopyKey | null;
  onCopy: (text: string, key: CopyKey) => void;
}) {
  return (
    <div className="relative mt-4">
      <pre className="overflow-x-auto rounded-xl border border-stone-200 bg-stone-50 p-4 text-xs leading-relaxed text-stone-800">
        {command}
      </pre>
      <button
        type="button"
        onClick={() => void onCopy(command, copyKey)}
        className="absolute right-3 top-3 rounded-lg border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-700 hover:bg-stone-50"
      >
        {copied === copyKey ? "Copied!" : "Copy"}
      </button>
    </div>
  );
}
