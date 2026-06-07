import { useEffect, useState } from "react";
import { assetUrl } from "../lib/site";
import {
  INSTALL_FILES,
  LINUX_INSTALL,
  MAC_INSTALL_ARM,
  MAC_INSTALL_INTEL,
  MAC_QUICK_FIX,
} from "../lib/install";

type CopyKey = "arm" | "intel" | "quick" | "linux";

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
            Finish installing KathaGPT
          </h2>
          <p className="section-body mt-4">
            After your download starts, follow the steps for your platform below.
            On macOS, don&apos;t double-click the app from the DMG — Apple blocks
            unsigned downloads until you clear the quarantine flag.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-3xl">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950">
            <strong className="font-medium">Seeing &ldquo;could not verify&rdquo;?</strong>{" "}
            That dialog is normal for open-source apps without Apple&apos;s paid
            notarization. Use the install command below — it takes about 10 seconds.
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-8">
          <PlatformGuide
            id="install-macos-arm"
            step={1}
            title="macOS · Apple Silicon (M1–M4)"
            subtitle={`Downloaded ${INSTALL_FILES["mac-arm"]}? Keep it in ~/Downloads.`}
            steps={[
              "Open Terminal (Spotlight → type “Terminal”).",
              "Paste the command below and press Enter.",
              "KathaGPT installs to Applications and opens automatically.",
            ]}
            command={MAC_INSTALL_ARM}
            copyKey="arm"
            copied={copied}
            onCopy={copy}
          />

          <PlatformGuide
            id="install-macos-intel"
            step={2}
            title="macOS · Intel"
            subtitle={`Downloaded ${INSTALL_FILES["mac-intel"]}? Keep it in ~/Downloads.`}
            steps={[
              "Open Terminal.",
              "Paste the Intel install command below and press Enter.",
              "Wait for the app to copy, clear quarantine, and launch.",
            ]}
            command={MAC_INSTALL_INTEL}
            copyKey="intel"
            copied={copied}
            onCopy={copy}
          />

          <div id="install-macos-fix" className="surface-card p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
              macOS · already in Applications?
            </p>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              Quick fix if the app won&apos;t open
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Or right-click <strong className="text-stone-800">KathaGPT.app</strong>{" "}
              in Applications → <strong className="text-stone-800">Open</strong> →{" "}
              <strong className="text-stone-800">Open</strong> again.
            </p>
            <CopyBlock
              command={MAC_QUICK_FIX}
              copyKey="quick"
              copied={copied}
              onCopy={copy}
            />
          </div>

          <PlatformGuide
            id="install-linux"
            step={3}
            title="Linux · AppImage"
            subtitle={`Downloaded ${INSTALL_FILES.linux}?`}
            steps={[
              "Open Terminal.",
              "Run the commands below to make the AppImage executable and launch it.",
              "On first run, your distro may ask you to trust the AppImage — approve it.",
            ]}
            command={LINUX_INSTALL}
            copyKey="linux"
            copied={copied}
            onCopy={copy}
          />

          <div className="surface-card p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
              Step 4 · First launch
            </p>
            <h3 className="mt-2 text-lg font-semibold text-stone-900">
              Add your API key
            </h3>
            <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-stone-600">
              <li>Open KathaGPT and go to <strong className="text-stone-800">Settings → API Keys</strong>.</li>
              <li>Add an <strong className="text-stone-800">OpenRouter</strong> key (recommended) or connect OpenAI, Anthropic, Google, or Perplexity.</li>
              <li>Pick a model and start chatting — your history stays in local SQLite on your device.</li>
            </ol>
          </div>
        </div>

        <p className="mx-auto mt-10 max-w-3xl text-center text-sm text-stone-500">
          Prefer a script?{" "}
          <a
            href={assetUrl("downloads/install-macos.sh")}
            download="install-macos.sh"
            className="font-medium text-stone-800 underline decoration-stone-300 underline-offset-2 hover:decoration-stone-500"
          >
            Download install-macos.sh
          </a>{" "}
          — place your .dmg in Downloads, then run{" "}
          <code className="rounded bg-stone-200/80 px-1.5 py-0.5 text-xs text-stone-800">
            chmod +x install-macos.sh && ./install-macos.sh
          </code>
        </p>
      </div>
    </section>
  );
}

function PlatformGuide({
  id,
  step,
  title,
  subtitle,
  steps,
  command,
  copyKey,
  copied,
  onCopy,
}: {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  steps: string[];
  command: string;
  copyKey: CopyKey;
  copied: CopyKey | null;
  onCopy: (text: string, key: CopyKey) => void;
}) {
  return (
    <div id={id} className="surface-card scroll-mt-24 p-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
        Step {step}
      </p>
      <h3 className="mt-2 text-lg font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 text-sm text-stone-600">{subtitle}</p>
      <ol className="mt-4 list-inside list-decimal space-y-2 text-sm text-stone-600">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <CopyBlock command={command} copyKey={copyKey} copied={copied} onCopy={onCopy} />
    </div>
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
