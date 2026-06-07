import { useEffect, useState } from "react";
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

interface PlatformDownloadsProps {
  variant?: "grid" | "hero";
}

export function PlatformDownloads({ variant = "grid" }: PlatformDownloadsProps) {
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

  if (variant === "hero") {
    return (
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {PLATFORMS.map((p) => {
          const hosted = manifest?.platforms[p.id];
          const releaseAsset = release ? matchAsset(release.assets, p.id) : null;
          const href = hosted
            ? hostedDownloadUrl(hosted)
            : releaseAsset?.browser_download_url ?? null;
          const ready = Boolean(href);

          if (ready) {
            return (
              <a
                key={p.id}
                href={href!}
                download
                className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                {p.shortLabel}
                <span className="text-xs text-stone-300">Download</span>
              </a>
            );
          }

          return (
            <span
              key={p.id}
              className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-500"
            >
              {p.shortLabel}
              <span className="text-xs">Coming soon</span>
            </span>
          );
        })}
      </div>
    );
  }

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
            className="flex items-center justify-between rounded-xl border border-dashed border-stone-300 bg-stone-50 px-5 py-4 text-sm"
          >
            <span className="font-medium text-stone-700">{p.label}</span>
            <span className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs font-medium text-stone-500">
              Coming soon
            </span>
          </div>
        );
      })}
    </div>
  );
}
