import { SITE } from "../lib/site";

export function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden pt-32 pb-20 md:pt-40 md:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="relative mx-auto max-w-6xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-200">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
          </span>
          Rust backend · Local Edition v0.1
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
          Private AI chat,{" "}
          <span className="text-gradient">fast on your machine</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
          {SITE.description}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#download"
            className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-600/30 transition hover:bg-indigo-500 hover:shadow-indigo-500/40"
          >
            <DownloadIcon className="h-5 w-5" />
            Download for free
          </a>
          <a
            href={`https://github.com/${SITE.githubRepo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
          >
            <GitHubIcon className="h-5 w-5" />
            View on GitHub
          </a>
        </div>

        <p className="mt-6 text-sm text-slate-500">
          macOS · Windows · Linux · {SITE.license} License
        </p>
      </div>

      <div className="relative mx-auto mt-16 max-w-5xl px-6">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl shadow-indigo-500/10 backdrop-blur">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
            <span className="h-3 w-3 rounded-full bg-red-500/80" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <span className="h-3 w-3 rounded-full bg-green-500/80" />
            <span className="ml-3 text-xs text-slate-500">KathGPT</span>
          </div>
          <div className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:p-8">
            <div className="space-y-4">
              <div className="rounded-xl bg-indigo-600/20 px-4 py-3 text-left text-sm text-indigo-100">
                Summarize my meeting notes and list action items.
              </div>
              <div className="rounded-xl border border-white/5 bg-slate-800/50 px-4 py-3 text-left text-sm text-slate-300">
                <p className="mb-2 font-medium text-slate-200">Action items</p>
                <ul className="list-inside list-disc space-y-1 text-slate-400">
                  <li>Send revised timeline to the team by Friday</li>
                  <li>Schedule follow-up with design on wireframes</li>
                  <li>Draft Q3 OKRs from today&apos;s discussion</li>
                </ul>
              </div>
            </div>
            <div className="hidden flex-col justify-end gap-2 text-right text-xs text-slate-500 md:flex">
              <span className="text-orange-300/90">● Rust API · Axum</span>
              <span>SQLite on device</span>
              <span className="text-emerald-400/80">● Loopback only</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
