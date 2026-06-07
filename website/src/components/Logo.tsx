import { SITE, assetUrl } from "../lib/site";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <a href={assetUrl("/")} className={`inline-flex items-center gap-2.5 ${className}`}>
      <img
        src={assetUrl("logo.svg")}
        alt={`${SITE.name} logo`}
        className="h-9 w-9 rounded-[14px] shadow-lg shadow-cyan-500/25"
      />
      <span className="bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-lg font-bold tracking-tight text-transparent">
        {SITE.name}
      </span>
    </a>
  );
}
