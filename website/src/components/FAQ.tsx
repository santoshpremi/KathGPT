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
    a: "Research assistant (cited web search), image generator, translator, meeting notes, tech support helper, prompt library, workflows, and chat artifacts — all backed by the same Rust API.",
  },
  {
    q: "How is this different from ChatGPT?",
    a: "KathGPT is a native desktop app with local SQLite storage. No KathGPT accounts, no subscription to us, and no cloud copy of your conversations — only the LLM providers you choose see your prompts.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="border-t border-white/5 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
          Frequently asked questions
        </h2>

        <dl className="mt-12 space-y-4">
          {faqs.map((item) => (
            <div
              key={item.q}
              className="rounded-xl border border-white/5 bg-slate-900/30 px-6 py-5"
            >
              <dt className="font-semibold text-white">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-slate-400">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
