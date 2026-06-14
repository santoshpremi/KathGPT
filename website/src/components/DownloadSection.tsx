import { DownloadButton } from "./DownloadButton";
import { PlatformDownloads } from "./PlatformDownloads";
import { SITE } from "../lib/site";

export function DownloadSection() {
  return (
    <section id="download" className="border-b border-stone-900 bg-stone-900/10 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label">Get started</p>
          <h2 className="section-title mt-3">Download KathaGPT</h2>
          <p className="section-body mt-4">
            Installers for macOS (Apple Silicon & Intel), Windows, and Linux are
            available below. After downloading, you&apos;ll be taken to{" "}
            be taken to{" "}
            <a
              href="#install-setup"
              className="font-medium text-stone-200 underline decoration-stone-700 underline-offset-2 hover:decoration-stone-500"
            >
              Install Setup
            </a>{" "}
            for next steps.
          </p>
        </div>

        <div className="mx-auto mt-10 flex flex-col items-center">
          <DownloadButton size="lg" showMeta className="w-full max-w-md" />
        </div>

        <div className="mt-10">
          <PlatformDownloads />
        </div>

        <div className="surface-card mx-auto mt-12 max-w-2xl p-6">
          <h3 className="font-semibold text-white">System requirements</h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-400">
            <li>
              <strong className="text-stone-200">macOS (Apple Silicon):</strong>{" "}
              11+ — available above
            </li>
            <li>
              <strong className="text-stone-200">macOS (Intel):</strong> 11+ —
              available above
            </li>
            <li>
              <strong className="text-stone-200">Linux:</strong> Ubuntu 20.04+ —
              AppImage available above
            </li>
            <li>
              <strong className="text-stone-200">Windows:</strong> 10+ (64-bit) —
              NSIS installer available above
            </li>
            <li>
              <strong className="text-stone-200">API key:</strong> OpenRouter
              recommended
            </li>
          </ul>
        </div>

        <p className="mt-8 text-center text-sm text-stone-500">
          Open source · {SITE.license}.{" "}
          <a
            href={`https://github.com/${SITE.githubRepo}/blob/main/README.md`}
            className="text-stone-200 underline decoration-stone-700 underline-offset-2 hover:decoration-stone-500"
          >
            Build other platforms from source
          </a>
        </p>
      </div>
    </section>
  );
}
