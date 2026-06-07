import { useState } from "react";
import { assetUrl } from "../lib/site";

const INSTALL_SCRIPT = `hdiutil attach ~/Downloads/KathGPT_0.1.0_aarch64.dmg -nobrowse -readonly && \\
VOL=$(ls -d /Volumes/KathGPT* | head -1) && \\
ditto "$VOL/KathGPT.app" /Applications/KathGPT.app && \\
xattr -cr /Applications/KathGPT.app && \\
hdiutil detach "$VOL" -quiet && \\
open /Applications/KathGPT.app`;

const QUICK_FIX = "xattr -cr /Applications/KathGPT.app && open -a KathGPT";

export function MacOSInstallHelp() {
  const [copied, setCopied] = useState<"script" | "quick" | null>(null);

  const copy = async (text: string, key: "script" | "quick") => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-amber-500/30 bg-amber-500/5 p-6 text-left">
      <h3 className="text-lg font-semibold text-amber-100">
        macOS blocked the app?
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">
        Browsers mark downloaded apps with a quarantine flag. Apple shows
        &ldquo;could not verify&rdquo; until you clear it. This is normal for
        open-source apps without a paid Apple notarization certificate.
      </p>

      <p className="mt-4 text-sm font-medium text-white">
        Option A — one Terminal command (recommended)
      </p>
      <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-slate-400">
        <li>Download the .dmg above (keep it in Downloads)</li>
        <li>Open Terminal, paste this, press Enter:</li>
      </ol>
      <div className="relative mt-2">
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-4 text-xs leading-relaxed text-emerald-200/90">
          {INSTALL_SCRIPT}
        </pre>
        <button
          type="button"
          onClick={() => void copy(INSTALL_SCRIPT, "script")}
          className="absolute right-3 top-3 rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
        >
          {copied === "script" ? "Copied!" : "Copy"}
        </button>
      </div>

      <p className="mt-5 text-sm font-medium text-white">
        Option B — already dragged to Applications?
      </p>
      <p className="mt-1 text-sm text-slate-400">
        Run this in Terminal, then open KathGPT again:
      </p>
      <div className="relative mt-2">
        <pre className="overflow-x-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs text-emerald-200/90">
          {QUICK_FIX}
        </pre>
        <button
          type="button"
          onClick={() => void copy(QUICK_FIX, "quick")}
          className="absolute right-3 top-3 rounded-lg bg-white/10 px-3 py-1 text-xs font-medium text-white hover:bg-white/20"
        >
          {copied === "quick" ? "Copied!" : "Copy"}
        </button>
      </div>

      <p className="mt-5 text-sm font-medium text-white">Option C — manual</p>
      <p className="mt-1 text-sm text-slate-400">
        Right-click <strong className="text-slate-300">KathGPT.app</strong> in
        Applications → <strong className="text-slate-300">Open</strong> →{" "}
        <strong className="text-slate-300">Open</strong> again.
      </p>

      <a
        href={assetUrl("downloads/install-macos.sh")}
        download="install-macos.sh"
        className="mt-4 inline-flex text-sm font-medium text-indigo-400 hover:underline"
      >
        Download install script →
      </a>
    </div>
  );
}
