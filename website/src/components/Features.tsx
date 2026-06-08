const features = [
  {
    title: "Run AI locally — no key needed",
    description:
      "Click 'Add Local Model', pick Llama, Mistral, Gemma, Phi-4, Qwen or DeepSeek, download once, and chat offline forever. 18 curated models up to 16 GB RAM. Metal, CUDA, and CPU all supported.",
    icon: LocalModelIcon,
  },
  {
    title: "Rust-powered core",
    description:
      "Chat streaming, SQLite, LLM routing, research, translation, and image tools all run in a single Rust process — fast, memory-safe, no Node server.",
    icon: RustIcon,
  },
  {
    title: "Your data stays local",
    description:
      "Chats, workflows, and settings live in a SQLite database on your device — not on our servers.",
    icon: ShieldIcon,
  },
  {
    title: "Bring your own key",
    description:
      "Connect OpenRouter, OpenAI, Anthropic, Google, or Perplexity. You control cost and models. No key required for local inference.",
    icon: KeyIcon,
  },
  {
    title: "Multi-model chat",
    description:
      "Switch between local models, GPT, Claude, Gemini, and more mid-conversation with a built-in model picker.",
    icon: SparklesIcon,
  },
  {
    title: "Built-in AI tools",
    description:
      "Research assistant with citations, image generator, translator, meeting notes, prompt library, and reusable workflows.",
    icon: ToolsIcon,
  },
  {
    title: "Workflows & artifacts",
    description:
      "Save reusable prompts, run demo workflows, and keep structured outputs alongside your chats.",
    icon: WorkflowIcon,
  },
  {
    title: "Native desktop app",
    description:
      "Tauri v2 ships a small installer on macOS, Windows, and Linux — system tray, native window, and a fraction of the RAM of Electron apps.",
    icon: DesktopIcon,
  },
  {
    title: "Privacy by design",
    description:
      "No accounts, no telemetry, no cloud sync. Local models never leave your machine. Cloud LLM calls are only made when you choose a cloud provider.",
    icon: LockIcon,
  },
];

export function Features() {
  return (
    <section id="features" className="border-b border-stone-200 bg-white py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="section-label">Why KathaGPT</p>
          <h2 className="section-title mt-3">
            Local AI + Cloud AI, in one app
          </h2>
          <p className="section-body mt-4">
            Run powerful AI models on your own hardware — no subscription, no
            API key, no cloud dependency. Or connect any cloud provider when you
            need frontier-model power.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="surface-card p-6 transition hover:border-stone-300"
            >
              <div className="mb-4 inline-flex rounded-xl border border-stone-200 bg-stone-50 p-3 text-stone-700">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-stone-900">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function LocalModelIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  );
}

function RustIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C9.8 2 8 3.8 8 6v1H6.5C5.1 7 4 8.1 4 9.5v9C4 19.9 5.1 21 6.5 21h11c1.4 0 2.5-1.1 2.5-2.5v-9C20 8.1 18.9 7 17.5 7H16V6c0-2.2-1.8-4-4-4zm0 2c1.1 0 2 .9 2 2v1h-4V6c0-1.1.9-2 2-2zm-5.5 5h11c.3 0 .5.2.5.5v9c0 .3-.2.5-.5.5h-11c-.3 0-.5-.2-.5-.5v-9c0-.3.2-.5.5-.5z" />
    </svg>
  );
}

function ToolsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z" />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function KeyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499a1.875 1.875 0 011.591-.659H15.75z" />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
    </svg>
  );
}

function WorkflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  );
}

function DesktopIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}
