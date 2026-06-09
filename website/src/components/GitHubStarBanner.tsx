import { useEffect, useState } from "react";
import { fetchGitHubStarCount, getGitHubRepoUrl, SITE } from "../lib/site";

const DISMISS_KEY = "kathagpt_github_star_banner_dismissed";

interface GitHubStarBannerProps {
  onVisibleChange?: (visible: boolean) => void;
}

export function GitHubStarBanner({ onVisibleChange }: GitHubStarBannerProps) {
  const [visible, setVisible] = useState(false);
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "true") return;
    setVisible(true);
    void fetchGitHubStarCount().then(setStars);
  }, []);

  useEffect(() => {
    onVisibleChange?.(visible);
  }, [visible, onVisibleChange]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  const repoUrl = getGitHubRepoUrl();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-700 bg-stone-900 px-4 py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]"
      role="complementary"
      aria-label="Star KathaGPT on GitHub"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <p className="min-w-0 text-sm text-stone-300 sm:text-base">
          <span className="hidden sm:inline">
            Enjoying {SITE.name}?{" "}
          </span>
          <span className="font-medium text-white">
            Star us on GitHub
          </span>
          <span className="hidden text-stone-400 sm:inline">
            {" "}
            — it helps others discover the project.
          </span>
        </p>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <a
            href={repoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-stone-600 bg-stone-800 px-4 py-2 text-sm font-medium text-white transition hover:border-stone-500 hover:bg-stone-700"
          >
            <StarIcon className="h-4 w-4 text-amber-400" />
            {stars !== null ? (
              <span>
                Star
                <span className="ml-1.5 tabular-nums text-stone-300">
                  {stars.toLocaleString()}
                </span>
              </span>
            ) : (
              "Star on GitHub"
            )}
          </a>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-stone-400 transition hover:bg-stone-800 hover:text-white"
            aria-label="Dismiss banner"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
