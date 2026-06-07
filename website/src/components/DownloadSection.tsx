import { useEffect, useState } from "react";
import {
  detectPlatform,
  fetchLatestRelease,
  formatBytes,
  getReleasesUrl,
  matchAsset,
  PLATFORMS,
  SITE,
  type GitHubRelease,
  type PlatformId,
} from "../lib/site";

export function DownloadSection() {
  const [release, setRelease] = useState<GitHubRelease | null>(null);
  const [loading, setLoading] = useState(true);
  const [platform] = useState<PlatformId>(() => detectPlatform());

  useEffect(() => {
    let cancelled = false;
    void fetchLatestRelease().then((data) => {
      if (!cancelled) {
        setRelease(data);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const primaryPlatform = PLATFORMS.find((p) => p.id === platform)!;
  const primaryAsset = release ? matchAsset(release.assets, platform) : null;
  const releasesUrl = getReleasesUrl();
  const buildFromSourceUrl = `https://github.com/${SITE.githubRepo}#quick-start`;

  return (
    <section id="download" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Download KathGPT
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Free, open-source desktop app for macOS, Windows, and Linux. Install,
            add your API key, and start chatting in minutes.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-xl">
          {loading ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/5 bg-slate-900/50 p-10">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-sm text-slate-400">Checking for latest release…</p>
            </div>
          ) : primaryAsset ? (
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-slate-900/50 p-8 text-center shadow-xl shadow-indigo-500/10">
              {release && (
                <p className="mb-4 text-sm text-indigo-300">
                  Latest: {release.tag_name}
                </p>
              )}
              <a
                href={primaryAsset.browser_download_url}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 sm:w-auto"
              >
                <DownloadIcon className="h-5 w-5" />
                Download for {primaryPlatform.shortLabel}
              </a>
              <p className="mt-3 text-sm text-slate-400">
                {primaryAsset.name} · {formatBytes(primaryAsset.size)}
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-indigo-500/10 to-slate-900/50 p-8 text-center">
              <p className="text-sm font-medium text-indigo-300">
                v{SITE.version} installers
              </p>
              <p className="mt-3 text-slate-300">
                Desktop builds (.dmg · .msi · .AppImage) are published on GitHub
                Releases. If the latest build is still running in CI, check back
                in a few minutes or build from source now.
              </p>
              <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <a
                  href={releasesUrl}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 sm:w-auto"
                >
                  <DownloadIcon className="h-5 w-5" />
                  Get installers on GitHub
                </a>
                <a
                  href={buildFromSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-white transition hover:bg-white/10 sm:w-auto"
                >
                  Build from source
                </a>
              </div>
              <p className="mt-4 text-sm text-slate-500">
                Local build:{" "}
                <code className="rounded bg-black/30 px-1.5 py-0.5 text-amber-200/90">
                  pnpm install && pnpm tauri:build
                </code>
              </p>
            </div>
          )}
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
          {PLATFORMS.map((p) => {
            const asset = release ? matchAsset(release.assets, p.id) : null;
            const isCurrent = p.id === platform;

            return (
              <a
                key={p.id}
                href={asset?.browser_download_url ?? releasesUrl}
                target={asset ? undefined : "_blank"}
                rel={asset ? undefined : "noopener noreferrer"}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                  isCurrent
                    ? "border-indigo-500/40 bg-indigo-500/10 text-white"
                    : "border-white/5 bg-slate-900/30 text-slate-300 hover:border-white/10 hover:bg-slate-900/50"
                }`}
              >
                <span className="font-medium">{p.label}</span>
                {asset ? (
                  <span className="text-xs text-slate-400">
                    {formatBytes(asset.size)}
                  </span>
                ) : (
                  <span className="text-xs text-indigo-400">GitHub Releases →</span>
                )}
              </a>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-white/5 bg-slate-900/30 p-6">
          <h3 className="font-semibold text-white">System requirements</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <strong className="text-slate-300">macOS:</strong> 11 Big Sur or
              later (Apple Silicon or Intel)
            </li>
            <li>
              <strong className="text-slate-300">Windows:</strong> Windows 10 or
              later (64-bit)
            </li>
            <li>
              <strong className="text-slate-300">Linux:</strong> Ubuntu 20.04+
              or equivalent with WebKitGTK
            </li>
            <li>
              <strong className="text-slate-300">API key:</strong> OpenRouter
              recommended (free tier at openrouter.ai)
            </li>
          </ul>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Open source under {SITE.license}.{" "}
          <a
            href={`https://github.com/${SITE.githubRepo}/blob/main/README.md`}
            className="text-indigo-400 hover:underline"
          >
            README & quick start
          </a>
        </p>
      </div>
    </section>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
