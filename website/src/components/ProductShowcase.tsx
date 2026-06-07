import { useState } from "react";
import { AppWindow } from "./AppWindow";
import {
  PRODUCT_FEATURES,
  type FeatureId,
  type ProductFeature,
} from "../lib/features";

const TAB_ICONS: Record<FeatureId, (props: { className?: string }) => JSX.Element> = {
  chat: ChatIcon,
  image: ImageIcon,
  research: ResearchIcon,
  translation: TranslateIcon,
};

export function ProductShowcase() {
  const [active, setActive] = useState<FeatureId>("chat");
  const feature =
    PRODUCT_FEATURES.find((f) => f.id === active) ?? PRODUCT_FEATURES[0];

  return (
    <section id="product" className="border-b border-stone-200 bg-white py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="section-label">Product</p>
          <h2 className="section-title mt-3 md:text-5xl">
            One app. Four powerful tools.
          </h2>
          <p className="section-body mt-4">
            Chat, generate images, research with citations, and translate whole
            documents — all in a native desktop workspace that keeps your data local.
          </p>
        </div>

        <div className="mt-14 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-12">
          <AppWindow
            image={feature.image}
            alt={`KathGPT ${feature.label} screenshot`}
            className="shadow-product"
            priority={active === "chat"}
          />

          <FeaturePanel feature={feature} />
        </div>

        <nav
          className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-1 rounded-full border border-stone-200 bg-stone-50 p-1"
          aria-label="Product features"
        >
          {PRODUCT_FEATURES.map((item) => {
            const Icon = TAB_ICONS[item.id];
            const isActive = item.id === active;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActive(item.id)}
                className={`inline-flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-stone-900 shadow-soft"
                    : "text-stone-500 hover:text-stone-800"
                }`}
                aria-pressed={isActive}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </section>
  );
}

function FeaturePanel({ feature }: { feature: ProductFeature }) {
  return (
    <div className="mt-10 lg:mt-0">
      <div className="surface-card p-6 lg:sticky lg:top-24">
        <p className="section-label">{feature.label}</p>
        <h3 className="mt-2 text-xl font-semibold text-stone-900">{feature.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          {feature.description}
        </p>
        <ul className="mt-5 space-y-3">
          {feature.bullets.map((bullet) => (
            <li key={bullet} className="flex gap-3 text-sm text-stone-700">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
    </svg>
  );
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function ResearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
    </svg>
  );
}

function TranslateIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802" />
    </svg>
  );
}
