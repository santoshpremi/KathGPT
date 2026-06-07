import { SITE } from "../lib/site";

const badges = [
  { label: "Open source", value: `${SITE.license} License` },
  { label: "Backend", value: "Rust · Axum" },
  { label: "Desktop", value: "Tauri v2" },
  { label: "Storage", value: "Local SQLite" },
];

export function TrustBar() {
  return (
    <section className="border-b border-stone-200 bg-stone-50 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-6">
        {badges.map((badge) => (
          <div key={badge.label} className="flex items-center gap-2.5 text-sm">
            <span className="font-medium text-stone-800">{badge.label}</span>
            <span className="text-stone-400">·</span>
            <span className="text-stone-500">{badge.value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
