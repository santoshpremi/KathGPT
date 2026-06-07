interface AppWindowProps {
  image: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

export function AppWindow({
  image,
  alt,
  className = "",
  priority = false,
}: AppWindowProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 shadow-2xl shadow-black/40 ring-1 ring-white/5 ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-white/5 bg-slate-900/95 px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-red-500/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
        <span className="ml-3 text-xs font-medium text-slate-500">KathGPT</span>
      </div>
      <div className="relative bg-slate-100">
        <img
          src={image}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="block w-full"
        />
      </div>
    </div>
  );
}
