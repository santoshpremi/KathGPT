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
      className={`overflow-hidden rounded-2xl border border-stone-200 bg-white ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-50 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-stone-300" />
        <span className="ml-3 text-xs font-medium text-stone-500">KathGPT</span>
      </div>
      <div className="relative bg-stone-100">
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
