import { DownloadButton } from "./DownloadButton";
import { SITE } from "../lib/site";

export function CTASection() {
  return (
    <section className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600/20 via-slate-900 to-violet-600/10 px-8 py-14 text-center md:px-16">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.25),transparent_60%)]" />

          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
              Ready to run AI on your terms?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
              Download KathGPT for free. No account, no subscription — just your
              API keys and a fast Rust-powered desktop app.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <DownloadButton size="lg" showMeta className="min-w-[260px]" />
              <a
                href={`https://github.com/${SITE.githubRepo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
