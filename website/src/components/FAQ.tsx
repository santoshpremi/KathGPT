import { useState } from "react";

const faqs = [
  {
    q: "Is KathGPT really free?",
    a: "Yes. KathGPT Local Edition is open source (MIT) on GitHub. You only pay for LLM API usage through your chosen provider (e.g. OpenRouter, OpenAI).",
  },
  {
    q: "Why Rust instead of Node.js or Electron?",
    a: "Rust gives KathGPT a fast, memory-safe backend with low overhead — SSE streaming, SQLite, and LLM routing in one native process. Tauri uses your OS WebView instead of bundling Chromium, so the app stays lightweight compared to typical Electron chat clients.",
  },
  {
    q: "Where is my data stored?",
    a: "Everything stays on your computer in a SQLite database inside your OS app-data folder — for example ~/Library/Application Support/KathGPT/ on macOS. Export and import JSON backups anytime from Settings.",
  },
  {
    q: "Do I need an internet connection?",
    a: "You need internet to call LLM APIs when chatting or using online tools (research, images, translation). The app works offline for browsing history, settings, workflows, and the prompt library.",
  },
  {
    q: "Which AI models are supported?",
    a: "Any model available through your configured providers — GPT, Claude, Gemini, and more via OpenRouter, plus direct OpenAI, Anthropic, Google, and Perplexity keys. Research assistant uses Perplexity Sonar models.",
  },
  {
    q: "What tools are included?",
    a: "Research assistant (cited web search), image generator, translator with PDF support, meeting notes, tech support helper, prompt library, workflows, and chat artifacts — all backed by the same Rust API.",
  },
  {
    q: "How is this different from ChatGPT?",
    a: "KathGPT is a native desktop app with local SQLite storage. No KathGPT accounts, no subscription to us, and no cloud copy of your conversations — only the LLM providers you choose see your prompts.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <dl className="mt-12 space-y-3">
          {faqs.map((item, index) => {
            const isOpen = openIndex === index;

            return (
              <div
                key={item.q}
                className={`rounded-2xl border transition ${
                  isOpen
                    ? "border-indigo-500/30 bg-slate-900/60"
                    : "border-white/5 bg-slate-900/30 hover:border-white/10"
                }`}
              >
                <dt>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="font-semibold text-white">{item.q}</span>
                    <ChevronIcon
                      className={`h-5 w-5 shrink-0 text-slate-500 transition ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </dt>
                {isOpen && (
                  <dd className="border-t border-white/5 px-6 pb-5 pt-1 text-sm leading-relaxed text-slate-400">
                    {item.a}
                  </dd>
                )}
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}
