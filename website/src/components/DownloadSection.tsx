import { DownloadButton } from "./DownloadButton";
import { MacOSInstallHelp } from "./MacOSInstallHelp";
import { PlatformDownloads } from "./PlatformDownloads";
import { SITE } from "../lib/site";

export function DownloadSection() {
  return (
    <section id="download" className="border-b border-stone-200 bg-stone-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label">Get started</p>
          <h2 className="section-title mt-3">Download KathGPT</h2>
          <p className="section-body mt-4">
            Apple Silicon is available now. Intel Mac, Windows, and Linux builds
            are on the way.
          </p>
        </div>

        <div className="mx-auto mt-10 flex flex-col items-center">
          <DownloadButton size="lg" showMeta className="w-full max-w-md" />
        </div>

        <MacOSInstallHelp />

        <div className="mt-10">
          <PlatformDownloads />
        </div>

        <div className="surface-card mx-auto mt-12 max-w-2xl p-6">
          <h3 className="font-semibold text-stone-900">System requirements</h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            <li>
              <strong className="text-stone-800">macOS (Apple Silicon):</strong>{" "}
              11+ — available above
            </li>
            <li>
              <strong className="text-stone-800">macOS (Intel):</strong> 11+ —
              coming soon
            </li>
            <li>
              <strong className="text-stone-800">Windows:</strong> 10+ (64-bit) —
              coming soon
            </li>
            <li>
              <strong className="text-stone-800">Linux:</strong> Ubuntu 20.04+ —
              coming soon
            </li>
            <li>
              <strong className="text-stone-800">API key:</strong> OpenRouter
              recommended
            </li>
          </ul>
        </div>

        <p className="mt-8 text-center text-sm text-stone-500">
          Open source · {SITE.license}.{" "}
          <a
            href={`https://github.com/${SITE.githubRepo}/blob/main/README.md`}
            className="text-stone-800 underline decoration-stone-300 underline-offset-2 hover:decoration-stone-500"
          >
            Build other platforms from source
          </a>
        </p>
      </div>
    </section>
  );
}
