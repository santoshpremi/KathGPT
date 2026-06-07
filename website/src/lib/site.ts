export const SITE = {
  name: "KathGPT",
  tagline: "Fast, private AI — powered by Rust",
  description:
    "A native desktop app with a Rust backend. Connect OpenRouter, Perplexity, GPT, Claude, Gemini, or your own provider — and keep every conversation on your device.",
  githubRepo: import.meta.env.VITE_GITHUB_REPO ?? "santoshpremi/KathGPT",
  license: "MIT",
  version: "0.1.0",
} as const;

/** Public asset path — respects Vite base (e.g. /KathGPT/ on GitHub Pages). */
export function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL;
  return `${base}${path.replace(/^\//, "")}`;
}

export type PlatformId = "mac-arm" | "mac-intel" | "windows" | "linux";

export interface DownloadManifest {
  version: string;
  platforms: Partial<Record<PlatformId, string | null>>;
}

/** Same-origin installer URL served from this website (GitHub Pages). */
export function hostedDownloadUrl(filename: string): string {
  return assetUrl(`downloads/${filename}`);
}

export async function fetchDownloadManifest(): Promise<DownloadManifest | null> {
  try {
    const res = await fetch(assetUrl("downloads/manifest.json"), {
      cache: "no-cache",
    });
    if (!res.ok) return null;
    return (await res.json()) as DownloadManifest;
  } catch {
    return null;
  }
}

export interface PlatformDownload {
  id: PlatformId;
  label: string;
  shortLabel: string;
  extensions: string[];
  keywords: string[];
}

export const PLATFORMS: PlatformDownload[] = [
  {
    id: "mac-arm",
    label: "macOS (Apple Silicon)",
    shortLabel: "Mac · Apple Silicon",
    extensions: [".dmg", ".app.tar.gz"],
    keywords: ["aarch64", "arm64", "apple-darwin", "darwin-aarch64"],
  },
  {
    id: "mac-intel",
    label: "macOS (Intel)",
    shortLabel: "Mac · Intel",
    extensions: [".dmg", ".app.tar.gz"],
    keywords: ["x64", "x86_64", "apple-darwin", "darwin-x86"],
  },
  {
    id: "windows",
    label: "Windows",
    shortLabel: "Windows",
    extensions: [".msi", ".exe"],
    keywords: ["windows", "nsis", "msi"],
  },
  {
    id: "linux",
    label: "Linux",
    shortLabel: "Linux",
    extensions: [".AppImage", ".deb", ".rpm"],
    keywords: ["linux", "appimage", "deb"],
  },
];

export interface ReleaseAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  html_url: string;
  assets: ReleaseAsset[];
}

export function getReleasesUrl(): string {
  return `https://github.com/${SITE.githubRepo}/releases`;
}

export function getLatestReleaseApiUrl(): string {
  return `https://api.github.com/repos/${SITE.githubRepo}/releases/latest`;
}

export function detectPlatform(): PlatformId {
  const ua = navigator.userAgent.toLowerCase();
  const platform = navigator.platform?.toLowerCase() ?? "";

  if (ua.includes("win") || platform.includes("win")) return "windows";
  if (ua.includes("linux") || platform.includes("linux")) return "linux";

  if (ua.includes("mac") || platform.includes("mac")) {
    const nav = navigator as Navigator & {
      userAgentData?: { platform?: string; architecture?: string };
    };
    const arch = nav.userAgentData?.architecture?.toLowerCase();
    if (arch === "arm" || arch === "arm64") return "mac-arm";
    if (arch === "x86" || arch === "x86_64") return "mac-intel";
    // Apple Silicon Macs often report MacIntel in UA for compatibility
    if (ua.includes("arm") || ua.includes("aarch64")) return "mac-arm";
    return "mac-arm";
  }

  return "mac-arm";
}

function scoreAsset(name: string, platform: PlatformDownload): number {
  const lower = name.toLowerCase();
  let score = 0;

  for (const kw of platform.keywords) {
    if (lower.includes(kw)) score += 10;
  }
  for (const ext of platform.extensions) {
    if (lower.endsWith(ext.toLowerCase())) score += 20;
  }
  if (lower.includes("kathgpt")) score += 5;

  return score;
}

export function matchAsset(
  assets: ReleaseAsset[],
  platformId: PlatformId,
): ReleaseAsset | null {
  const platform = PLATFORMS.find((p) => p.id === platformId);
  if (!platform || assets.length === 0) return null;

  let best: ReleaseAsset | null = null;
  let bestScore = 0;

  for (const asset of assets) {
    const score = scoreAsset(asset.name, platform);
    if (score > bestScore) {
      bestScore = score;
      best = asset;
    }
  }

  return bestScore > 0 ? best : null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export async function fetchLatestRelease(): Promise<GitHubRelease | null> {
  try {
    const res = await fetch(getLatestReleaseApiUrl(), {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as GitHubRelease;
  } catch {
    return null;
  }
}
