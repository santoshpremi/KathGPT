const rustBenefits = [
  {
    title: "Native-speed backend",
    description:
      "The entire API — chat streaming, SQLite, LLM routing, and tools — runs in Rust. No Node.js server, no extra runtime.",
  },
  {
    title: "Low memory footprint",
    description:
      "Tauri uses your OS WebView instead of bundling Chromium. The Rust core stays lean while the UI stays familiar React.",
  },
  {
    title: "Fast streaming",
    description:
      "SSE token streams are parsed and forwarded in Rust with minimal overhead, so responses feel snappy even on modest hardware.",
  },
  {
    title: "Memory-safe by default",
    description:
      "Rust’s ownership model catches whole classes of bugs at compile time — fewer crashes, safer handling of your local data.",
  },
];

const stack = [
  { label: "UI", value: "React · Vite · MUI" },
  { label: "API", value: "Rust · Axum · Tokio" },
  { label: "Desktop", value: "Tauri v2" },
  { label: "Storage", value: "SQLite · sqlx" },
  { label: "LLM", value: "reqwest · SSE" },
];

export function TechStack() {
  return (
    <section id="tech" className="border-b border-stone-900 bg-stone-900/10 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label">Powered by Rust</p>
          <h2 className="section-title mt-3">
            Performance you can feel, privacy you can trust
          </h2>
          <p className="section-body mt-4">
            KathaGPT replaced a Node.js backend with a single Rust core — embedded in
            the desktop app and bound to localhost. Less overhead, faster I/O, same
            powerful AI features.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rustBenefits.map((item) => (
            <article key={item.title} className="surface-card p-5">
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-400">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {stack.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border border-stone-900 bg-stone-900/20 px-4 py-2 text-sm"
            >
              <span className="font-medium text-stone-200">{item.label}</span>
              <span className="text-stone-700">·</span>
              <span className="text-stone-400">{item.value}</span>
            </span>
          ))}
        </div>

        <div className="surface-card mx-auto mt-12 max-w-2xl p-6 text-center">
          <p className="text-sm text-stone-400">
            <span className="font-semibold text-white">vs. Electron-style apps:</span>{" "}
            Tauri + Rust means a smaller download, lower RAM use, and a backend that
            starts instantly — while still shipping a full React interface.
          </p>
        </div>
      </div>
    </section>
  );
}
