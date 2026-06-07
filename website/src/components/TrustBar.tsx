import { SITE } from "../lib/site";

const badges = [
  { label: "Open source", value: `${SITE.license} License` },
  { label: "Backend", value: "Rust · Axum" },
  { label: "Desktop", value: "Tauri v2" },
  { label: "Storage", value: "Local SQLite" },
];

export function TrustBar() {
  return (
    <section className="border-y border-white/5 bg-slate-900/30 py-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-6">
        {badges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-3">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
            <div className="text-sm">
              <span className="font-medium text-slate-300">{badge.label}</span>
              <span className="mx-2 text-slate-600">·</span>
              <span className="text-slate-500">{badge.value}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
