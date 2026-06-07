import { DownloadButton } from "./DownloadButton";
import { SITE } from "../lib/site";

export function CTASection() {
  return (
    <section className="bg-stone-50 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="rounded-3xl border border-stone-200 bg-stone-900 px-8 py-14 text-center md:px-16">
          <h2 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
            Ready to run AI on your terms?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-stone-400">
            Download KathGPT for free. No account, no subscription — just your
            API keys and a fast Rust-powered desktop app.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <DownloadButton size="lg" showMeta className="min-w-[260px] [&_a]:bg-white [&_a]:text-stone-900 [&_a]:hover:bg-stone-100" />
            <a
              href={`https://github.com/${SITE.githubRepo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-full border border-stone-600 px-8 py-4 text-base font-medium text-white transition hover:border-stone-500 hover:bg-stone-800"
            >
              Star on GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
