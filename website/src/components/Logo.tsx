import { SITE, assetUrl } from "../lib/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href={assetUrl("/")} className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={assetUrl("logo.svg")}
        alt={`${SITE.name} logo`}
        className="h-8 w-8 rounded-xl"
      />
      <span className="text-lg font-semibold tracking-tight text-stone-900">
        {SITE.name}
      </span>
    </a>
  );
}
