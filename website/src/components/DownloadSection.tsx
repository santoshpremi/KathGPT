import { useEffect, useState } from "react";
import { DownloadButton } from "./DownloadButton";
import { MacOSInstallHelp } from "./MacOSInstallHelp";
import {
  fetchDownloadManifest,
  formatBytes,
  hostedDownloadUrl,
  matchAsset,
  PLATFORMS,
  SITE,
  fetchLatestRelease,
  type DownloadManifest,
  type GitHubRelease,
} from "../lib/site";

export function DownloadSection() {
  const [manifest, setManifest] = useState<DownloadManifest | null>(null);
  const [release, setRelease] = useState<GitHubRelease | null>(null);

  useEffect(() => {
    void Promise.all([fetchDownloadManifest(), fetchLatestRelease()]).then(
      ([m, r]) => {
        setManifest(m);
        setRelease(r);
      },
    );
  }, []);

  return (
    <section id="download" className="border-b border-stone-200 bg-stone-50 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label">Get started</p>
          <h2 className="section-title mt-3">Download KathGPT</h2>
          <p className="section-body mt-4">
            Click below — the installer downloads directly from this site. No
            GitHub detour.
          </p>
        </div>

        <div className="mx-auto mt-10 flex flex-col items-center">
          <DownloadButton size="lg" showMeta className="w-full max-w-md" />
        </div>

        <MacOSInstallHelp />

        <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
          {PLATFORMS.map((p) => {
            const hosted = manifest?.platforms[p.id];
            const releaseAsset = release ? matchAsset(release.assets, p.id) : null;
            const href = hosted
              ? hostedDownloadUrl(hosted)
              : releaseAsset?.browser_download_url ?? null;
            const ready = Boolean(href);

            return ready ? (
              <a
                key={p.id}
                href={href!}
                download
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-900 transition hover:border-stone-300"
              >
                <span className="font-medium">{p.label}</span>
                <span className="rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white">
                  Download
                  {releaseAsset ? ` · ${formatBytes(releaseAsset.size)}` : ""}
                </span>
              </a>
            ) : (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-500"
              >
                <span className="font-medium">{p.label}</span>
                <span className="text-xs">Coming soon</span>
              </div>
            );
          })}
        </div>

        <div className="surface-card mx-auto mt-12 max-w-2xl p-6">
          <h3 className="font-semibold text-stone-900">System requirements</h3>
          <ul className="mt-3 space-y-2 text-sm text-stone-600">
            <li>
              <strong className="text-stone-800">macOS:</strong> 11+ (Apple Silicon
              — download above; Intel build coming soon)
            </li>
            <li>
              <strong className="text-stone-800">Windows:</strong> 10+ (64-bit)
            </li>
            <li>
              <strong className="text-stone-800">Linux:</strong> Ubuntu 20.04+
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
