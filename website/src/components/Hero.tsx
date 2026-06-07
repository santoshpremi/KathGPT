import { DownloadButton } from "./DownloadButton";
import { SITE } from "../lib/site";

export function Hero() {
  return (
    <section className="hero-glow relative overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#ffffff06_1px,transparent_1px),linear-gradient(to_bottom,#ffffff06_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_65%,transparent_100%)]" />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-400" />
            </span>
            Open source · Rust backend · Local Edition v0.1
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Private AI workspace,{" "}
            <span className="text-gradient">built for your desktop</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400 md:text-xl">
            {SITE.description}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <DownloadButton size="lg" showMeta className="min-w-[260px]" />
            <a
              href="#product"
              className="inline-flex min-w-[200px] items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
            >
              Explore features
            </a>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            macOS · Windows · Linux · {SITE.license} License
          </p>
        </div>
      </div>
    </section>
  );
}
