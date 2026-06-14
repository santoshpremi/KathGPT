import { DownloadButton } from "./DownloadButton";
import { MODEL_PROVIDERS } from "../lib/providers";
import { SITE } from "../lib/site";

export function Hero() {
  return (
    <section className="border-b border-stone-900 bg-black pt-28 pb-20 md:pt-36 md:pb-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label">Open source desktop app</p>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-[4.25rem] lg:leading-[1.05]">
            Private AI workspace,
            <br />
            built for your desktop
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-400 md:text-xl">
            {SITE.description}
          </p>

          <p
            className="mt-8 text-base text-stone-400 md:text-lg"
            aria-label="Supported model providers"
          >
            {MODEL_PROVIDERS.map((provider, index) => (
              <span key={provider}>
                <span
                  className="font-medium text-stone-200"
                >
                  {provider}
                </span>
                {index < MODEL_PROVIDERS.length - 1 && (
                  <span className="mx-2 text-stone-700" aria-hidden>
                    /
                  </span>
                )}
              </span>
            ))}
          </p>

          <div className="mt-10 flex justify-center">
            <DownloadButton size="lg" showMeta className="min-w-[260px]" />
          </div>

          <p className="mt-6 text-sm text-stone-500">
            macOS · Windows · Linux · {SITE.license} License · Local models need no API key
          </p>
        </div>
      </div>
    </section>
  );
}
