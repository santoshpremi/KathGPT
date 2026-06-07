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
    <section id="tech" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-400">
            Powered by Rust
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Performance you can feel, privacy you can trust
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            KathGPT replaced a Node.js backend with a single Rust core — embedded in
            the desktop app and bound to localhost. Less overhead, faster I/O, same
            powerful AI features.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rustBenefits.map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-orange-500/10 bg-gradient-to-b from-orange-500/5 to-slate-900/40 p-5"
            >
              <h3 className="font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {stack.map((item) => (
            <span
              key={item.label}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/60 px-4 py-2 text-sm"
            >
              <span className="font-medium text-slate-300">{item.label}</span>
              <span className="text-slate-500">·</span>
              <span className="text-slate-400">{item.value}</span>
            </span>
          ))}
        </div>

        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-white/5 bg-slate-900/50 p-6 text-center">
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-white">vs. Electron-style apps:</span>{" "}
            Tauri + Rust means a smaller download, lower RAM use, and a backend that
            starts instantly — while still shipping a full React interface.
          </p>
        </div>
      </div>
    </section>
  );
}
