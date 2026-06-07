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
    <section id="download" className="border-t border-white/5 py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Download KathGPT
          </h2>
          <p className="mt-4 text-lg text-slate-400">
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
                className="flex items-center justify-between rounded-xl border border-indigo-500/40 bg-indigo-500/10 px-5 py-4 text-sm text-white transition hover:border-indigo-400/60 hover:bg-indigo-500/20"
              >
                <span className="font-semibold">{p.label}</span>
                <span className="rounded-lg bg-indigo-600 px-3 py-1 text-xs font-medium">
                  Download
                  {releaseAsset ? ` · ${formatBytes(releaseAsset.size)}` : ""}
                </span>
              </a>
            ) : (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-900/30 px-5 py-4 text-sm text-slate-500"
              >
                <span className="font-medium">{p.label}</span>
                <span className="text-xs">Coming soon</span>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-white/5 bg-slate-900/30 p-6">
          <h3 className="font-semibold text-white">System requirements</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <strong className="text-slate-300">macOS:</strong> 11+ (Apple Silicon
              — download above; Intel build coming soon)
            </li>
            <li>
              <strong className="text-slate-300">Windows:</strong> 10+ (64-bit)
            </li>
            <li>
              <strong className="text-slate-300">Linux:</strong> Ubuntu 20.04+
            </li>
            <li>
              <strong className="text-slate-300">API key:</strong> OpenRouter
              recommended
            </li>
          </ul>
        </div>

        <p className="mt-8 text-center text-sm text-slate-500">
          Open source · {SITE.license}.{" "}
          <a
            href={`https://github.com/${SITE.githubRepo}/blob/main/README.md`}
            className="text-indigo-400 hover:underline"
          >
            Build other platforms from source
          </a>
        </p>
      </div>
    </section>
  );
}
