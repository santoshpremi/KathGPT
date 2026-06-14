import { useEffect, useState } from "react";
import { navigateToInstallSetup } from "../lib/install";
import {
  fetchDownloadManifest,
  fetchLatestRelease,
  formatBytes,
  hostedDownloadUrl,
  matchAsset,
  PLATFORMS,
  type DownloadManifest,
  type GitHubRelease,
} from "../lib/site";

export function PlatformDownloads() {
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
    <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-2">
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
            onClick={() => navigateToInstallSetup(p.id)}
            className="flex items-center justify-between rounded-xl border border-stone-800 bg-stone-900/40 px-5 py-4 text-sm text-stone-100 transition hover:border-stone-700 hover:bg-stone-900/60"
          >
            <span className="font-medium">{p.label}</span>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-stone-950">
              Download
              {releaseAsset ? ` · ${formatBytes(releaseAsset.size)}` : ""}
            </span>
          </a>
        ) : (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-dashed border-stone-800 bg-black px-5 py-4 text-sm"
          >
            <span className="font-medium text-stone-400">{p.label}</span>
            <span className="rounded-full border border-stone-800 bg-stone-900 px-3 py-1 text-xs font-medium text-stone-500">
              Coming soon
            </span>
          </div>
        );
      })}
    </div>
  );
}
