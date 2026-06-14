import { usePrimaryDownload } from "../hooks/usePrimaryDownload";
import { navigateToInstallSetup } from "../lib/install";
import { formatBytes } from "../lib/site";

interface DownloadButtonProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showMeta?: boolean;
}

export function DownloadButton({
  size = "md",
  className = "",
  showMeta = false,
}: DownloadButtonProps) {
  const { loading, platform, platformMeta, downloadUrl, isReady, fileName, fileSize } =
    usePrimaryDownload();

  const sizeClasses = {
    sm: "px-4 py-2 text-sm",
    md: "px-8 py-3.5 text-base",
    lg: "px-10 py-4 text-lg",
  }[size];

  if (loading) {
    return (
      <span
        className={`inline-flex items-center justify-center gap-2 rounded-full bg-stone-800 font-medium text-white opacity-80 ${sizeClasses} ${className}`}
      >
        <DownloadIcon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
        Preparing download…
      </span>
    );
  }

  if (!isReady || !downloadUrl) {
    return (
      <span
        className={`inline-flex items-center justify-center gap-2 rounded-full border border-stone-800 bg-stone-900 font-medium text-stone-500 ${sizeClasses} ${className}`}
        title={`${platformMeta.label} installer not hosted yet`}
      >
        {platformMeta.shortLabel} — coming soon
      </span>
    );
  }

  return (
    <div className={className}>
      <a
        href={downloadUrl}
        download={fileName ?? true}
        onClick={() => navigateToInstallSetup(platform)}
        className={`inline-flex items-center justify-center gap-2 rounded-full bg-white font-semibold text-stone-950 transition hover:bg-stone-100 ${sizeClasses}`}
      >
        <DownloadIcon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
        Download for {platformMeta.shortLabel}
      </a>
      {showMeta && fileName && (
        <p className="mt-2 text-center text-xs text-stone-500">
          {fileName}
          {fileSize ? ` · ${formatBytes(fileSize)}` : ""}
        </p>
      )}
    </div>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}
