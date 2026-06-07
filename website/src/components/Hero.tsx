import { DownloadButton } from "./DownloadButton";
import { SITE } from "../lib/site";

export function Hero() {
  return (
    <section className="border-b border-stone-200 bg-white pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label">Open source desktop app</p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.05]">
            Private AI workspace,
            <br />
            built for your desktop
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-600 md:text-xl">
            {SITE.description}
          </p>

          <div className="mt-10 flex justify-center">
            <DownloadButton size="lg" showMeta className="min-w-[260px]" />
          </div>

          <p className="mt-6 text-sm text-stone-500">
            macOS · Windows · Linux · {SITE.license} License
          </p>
        </div>
      </div>
    </section>
  );
}
