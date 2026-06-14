# KathaGPT Local Edition

**Fast, private AI chat on your machine — powered by Rust.** Run local AI models with no API key, or bring your own for cloud providers. Every conversation stays on your device.

![KathaGPT demo](docs/demo.gif)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub](https://img.shields.io/github/stars/santoshpremi/KathaGPT?style=social)](https://github.com/santoshpremi/KathaGPT)

| | |
|---|---|
| **Version** | 0.1.0 |
| **Stack** | React · **Rust (Axum)** · Tauri v2 · SQLite · llama.cpp |
| **Platforms** | macOS · Windows · Linux |
| **Repo** | [github.com/santoshpremi/KathaGPT](https://github.com/santoshpremi/KathaGPT) |
| **Website** | [santoshpremi.github.io/KathaGPT](https://santoshpremi.github.io/KathaGPT/) |

---

## Full Local LLM Support — No API key required

> Click **Add Local Model** → search → **Download** → chat. No terminal, no Ollama, no external installs.

KathaGPT downloads and runs AI models entirely on your machine using a built-in **llama.cpp engine**. The runtime binary (~15 MB) and `.gguf` model files are fetched on demand — the installer stays compact.

### How it works

```
Open KathaGPT
  → Click "Add Local Model" in the user menu
  → Browse or search 18 curated models (Llama, Mistral, Gemma, Phi, Qwen, DeepSeek…)
  → Click Download on e.g. "Llama 3.2 3B"
  → Progress bar: downloads llama-server runtime + .gguf from HuggingFace
  → Model appears in the chat picker
  → Chat offline, forever — no API key needed
```

### Available models (18 curated — up to 16 GB RAM)

| RAM | Models |
|-----|--------|
| **2–4 GB** | Llama 3.2 1B · Gemma 2 2B · Llama 3.2 3B · Phi-3 Mini 3.8B · Qwen 3 4B |
| **8 GB** | Mistral 7B v0.3 · Llama 3.1 8B · Qwen 2.5 7B · Qwen 3 8B · DeepSeek R1 7B · Gemma 2 9B |
| **12 GB** | Gemma 3 12B · Mistral Nemo 12B · Phi-4 14B · Qwen 2.5 14B · Qwen 3 14B · DeepSeek R1 14B |
| **16 GB** | Mistral Small 22B · Qwen 2.5 32B |

All models are Q4_K_M quantized `.gguf` files sourced from [bartowski](https://huggingface.co/bartowski) and official repos on HuggingFace. GPU acceleration is automatic — **Metal on Apple Silicon**, CUDA on NVIDIA, CPU fallback everywhere.

---

## Powered by Rust

KathaGPT's backend is **100% Rust** — the old Node.js server is gone. One native core handles everything:

| Benefit | How |
|---------|-----|
| **Low overhead** | Axum API embedded in the Tauri process — no Node runtime, no Electron Chromium bundle |
| **Fast streaming** | SSE token streams parsed in Rust (`reqwest` + Tokio) with minimal latency |
| **Efficient storage** | SQLite via `sqlx` — instant chat history, workflows, and settings on disk |
| **Memory safety** | Rust catches data races and use-after-free at compile time |
| **Small installer** | Tauri uses the OS WebView → smaller installers, lower RAM than Electron |
| **Loopback-only API** | Server binds `127.0.0.1:17890` — not exposed to your LAN |

```
┌──────────────────────────────────────────────────┐
│  KathaGPT.app / .exe / .AppImage                  │
│  ┌────────────────────────────────────────────┐   │
│  │  Tauri (Rust)                              │   │
│  │  • Native window + system tray             │   │
│  │  • Axum API · SQLite · LLM routing         │   │
│  │  • llama-server sidecar (local models)     │   │
│  │  • WebView → React UI (dist/)              │   │
│  └────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────┘
       │ Local inference (127.0.0.1:11435)
       ▼
  llama-server (llama.cpp) — Metal / CUDA / CPU

       │ HTTPS (only when you use a cloud model)
       ▼
  OpenRouter / OpenAI / Anthropic / Gemini / Perplexity
```

---

## Why KathaGPT?

- **Truly local** — Run Llama, Mistral, Phi-4, Qwen, DeepSeek and more with zero API keys.
- **BYOK cloud** — Also connects to OpenRouter, OpenAI, Anthropic, Gemini, Perplexity.
- **Protected keys** — API keys stored locally, masked in UI. See [SECURITY.md](SECURITY.md).
- **Native desktop** — One-click `.dmg` / `.msi` / `.AppImage`; no Electron overhead.
- **Open source** — MIT licensed; inspect, fork, and self-host.

### What's included

| Area | Features |
|------|----------|
| **Local LLM** | 18 one-click models, Metal/CUDA GPU acceleration, llama.cpp sidecar, real-time download progress |
| **Chat** | Streaming responses, multi-model picker, artifacts, draft chats |
| **Tools** | Research assistant (Sonar + citations), image generator, translator, meeting notes |
| **Productivity** | Workflows, prompt library, JSON export/import |

---

## Quick start

### Prerequisites

| Tool | Version |
|------|---------|
| [Node.js](https://nodejs.org/) | ≥ 20.12 (see `.nvmrc`) |
| [pnpm](https://pnpm.io/) | 9+ |
| [Rust](https://rustup.rs/) | stable (for API & desktop builds) |

For desktop builds, install [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/) for your OS.

### 1. Install & run

```bash
git clone https://github.com/santoshpremi/KathaGPT.git
cd KathaGPT
pnpm install
./start-dev.sh          # or: pnpm dev
```

Open **http://localhost:5173** — the Rust API runs on **http://127.0.0.1:17890** (proxied as `/api/local`).

### 2. Add an API key (optional)

Copy the example env file and add at least one provider key:

```bash
cp .env.example .env
```

Or add keys in the app: **Settings → API Keys**. OpenRouter is recommended for the broadest cloud model access.

> **No key needed for local models.** Just click **Add Local Model** and download one.

### 3. Desktop app

```bash
pnpm tauri:dev          # dev with native window
pnpm tauri:build        # production installer (.dmg / .msi / .AppImage)
```

**macOS install (unsigned build):** Download from [the website](https://santoshpremi.github.io/KathaGPT/) or build locally. If macOS shows *"could not verify"*, the browser added a quarantine flag — this is expected without Apple notarization ($99/yr Developer ID).

1. **Terminal (recommended):** After downloading the `.dmg` to `~/Downloads`, run the one-liner on the [download page](https://santoshpremi.github.io/KathaGPT/#download), or:
   ```bash
   ./scripts/install-macos.sh
   ```
2. **Already in Applications?** `xattr -cr /Applications/KathaGPT.app && open -a KathaGPT`
3. **Manual:** Right-click **KathaGPT.app** → **Open** → **Open** again.

To ship notarized builds from CI, add GitHub secrets: `APPLE_CERTIFICATE`, `APPLE_CERTIFICATE_PASSWORD`, `APPLE_SIGNING_IDENTITY`, `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID`.

---

## Development

### Scripts

| Command | Description |
|---------|-------------|
| `./start-dev.sh` | Clears port conflicts & Vite cache, starts UI + Rust API |
| `pnpm dev` | Vite (`:5173`) + Rust API (`:17890`) |
| `pnpm local:api` | Rust API only |
| `pnpm build` | Production frontend build → `dist/` |
| `pnpm tauri:dev` | Tauri desktop + dev servers |
| `pnpm tauri:build` | Desktop installer bundles |
| `pnpm test:e2e` | Playwright end-to-end tests |
| `pnpm website:dev` | Marketing site on **:5174** (app uses :5173) |
| `pnpm website:build` | Build landing page → `website/dist` |

### Data locations

| OS | Path |
|----|------|
| macOS | `~/Library/Application Support/KathaGPT/kathagpt.db` |
| Windows | `%APPDATA%\KathaGPT\kathagpt.db` |
| Linux | `~/.local/share/KathaGPT/kathagpt.db` |

Local model binaries and `.gguf` files are stored in the Tauri app data directory under `bin/` and `models/`.

Health check: `GET http://127.0.0.1:17890/api/local/health`

### Project layout

```
KathaGPT/
├── src/                 # React UI (Vite + MUI)
├── src-tauri/           # Rust API, LLM routing, SQLite, Tauri shell
│   └── src/llm/
│       ├── sidecar.rs       # llama-server lifecycle manager
│       ├── model_catalog.rs # curated model list with HF URLs
│       └── model_dl.rs      # async download + SSE progress
├── website/             # Marketing landing page (separate Vite app)
├── migrations/          # SQLite schema
├── test/e2e/            # Playwright tests
└── docs/                # Architecture & migration notes
```

---

## API reference

All routes are under `/api/local`. The Node.js backend has been removed — everything goes through Rust.

<details>
<summary><strong>Core</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health + SQLite status |
| `GET` | `/v1/status` | Local edition metadata |
| `GET` | `/user/me` | Local user profile |
| `PATCH` | `/user/me` | Update profile |
| `GET` | `/data/export` | JSON backup snapshot |
| `POST` | `/data/import` | Restore from backup |

</details>

<details>
<summary><strong>Provider keys</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/provider-keys/status` | Key status for all providers |
| `POST` | `/provider-keys/set` | Save API key (local SQLite) |
| `DELETE` | `/provider-keys/{provider}` | Remove stored key |
| `POST` | `/provider-keys/test` | Test provider connection |

</details>

<details>
<summary><strong>Chat & messages</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/chats` | List chats (with messages only) |
| `POST` | `/chats` | Create chat |
| `GET` | `/chats/{id}` | Get chat |
| `PATCH` | `/chats/{id}` | Update chat |
| `DELETE` | `/chats/{id}` | Delete chat |
| `GET` | `/chats/{id}/messages` | List messages |
| `POST` | `/chats/{id}/messages/stream` | Send message (SSE: `init`, `delta`, `done`) |

</details>

<details>
<summary><strong>Models, workflows, artifacts</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/model-config/enabled` | Built-in model list |
| `GET` | `/model-config/available` | Models for configured keys |
| `GET` | `/model-config/provider-models/{provider}` | Provider-specific models |
| `GET` | `/model-config/openrouter-models` | OpenRouter catalog |
| `GET` | `/workflows` | List workflows |
| `POST` | `/workflows` | Create workflow |
| `GET` | `/workflows/favorites` | Favorite workflows |
| `POST` | `/workflows/{id}/favorite` | Toggle favorite |
| `GET` | `/chats/{id}/artifact` | Chat artifact |
| `POST` | `/artifacts` | Create artifact |
| `POST` | `/artifacts/{id}/stream` | Stream artifact revision |

</details>

<details>
<summary><strong>Local models</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/local-models/status` | Sidecar status + downloaded models |
| `GET` | `/local-models/catalog` | Full model catalog (18 models) |
| `POST` | `/local-models/download` | Start background download (binary + .gguf) |
| `GET` | `/local-models/progress` | SSE stream: real-time download progress |
| `DELETE` | `/local-models/{name}` | Delete a downloaded model |

</details>

<details>
<summary><strong>Tools</strong></summary>

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/research/query` | Research assistant (Sonar / citations) |
| `POST` | `/translate` | Text translation |
| `GET` | `/images/models` | Image generation models |
| `POST` | `/images/generate` | Generate image |
| `POST` | `/images/improve-prompt` | Improve image prompt |
| `POST` | `/files/extract-text` | Extract text from uploaded files |

</details>

Deeper architecture notes: [`docs/LOCAL_EDITION_MIGRATION_PLAN.md`](docs/LOCAL_EDITION_MIGRATION_PLAN.md)

---

## Testing

```bash
pnpm test:e2e           # headless
pnpm test:e2e:ui        # interactive UI
```

CI runs Rust checks (`.github/workflows/rust.yml`), Playwright (`.github/workflows/e2e.yml`), and release builds on version tags (`.github/workflows/release.yml`).

---

## Marketing website

The landing page lives in `website/` — features, FAQ, and GitHub Releases download buttons.

**Live site:** `https://santoshpremi.github.io/KathaGPT/`

```bash
pnpm website:dev        # http://localhost:5174
pnpm website:build
pnpm website:preview
```

Set `VITE_GITHUB_REPO=owner/repo` in `website/.env` (see `website/.env.example`) so download links point at your releases.

**Deploy:** Push to `main`/`master` → GitHub Actions builds and deploys to Pages (`.github/workflows/website.yml`). Enable **Settings → Pages → Source: GitHub Actions** once.

### Release checklist

1. Run `pnpm test:e2e` on `main`.
2. Set GitHub secret `TAURI_SIGNING_PRIVATE_KEY` (contents of `src-tauri/.tauri-updater.key`) if not already configured.
3. Tag: `git tag v0.1.1 && git push origin v0.1.1` — CI builds installers + signed updater artifacts + `latest.json`.
4. Confirm [GitHub Releases](https://github.com/santoshpremi/KathaGPT/releases) has `.dmg` / `.msi` / `.AppImage` and `latest.json`.
5. Verify the Pages site shows working download buttons.
6. Installed desktop apps check for updates automatically ~8s after launch (Settings → no action needed).

---

## Auto-updater (desktop)

The Tauri app checks [GitHub Releases](https://github.com/santoshpremi/KathaGPT/releases/latest/download/latest.json) for signed updates and prompts **Update & restart**.

**Maintainers:** generate keys once (`CI=true pnpm tauri signer generate -w src-tauri/.tauri-updater.key --ci`), keep the private key secret, and add it as `TAURI_SIGNING_PRIVATE_KEY` in GitHub Actions secrets. The public key is embedded in `src-tauri/tauri.conf.json`.

---

## Roadmap

| Area | Next steps |
|------|-----------|
| **Local LLM** | RAM detection + recommended picker (done); quant auto-pick (done), delete model UI (done) |
| **Context** | Token counter, smart truncation, remaining-tokens indicator (done) |
| **Desktop** | Global hotkey + quick-compose (done); auto-updater (done) |
| **Memory & RAG** | `sqlite-vec` vector search, document chat (PDF → chunks → embed) |
| **Agents** | Tool calling, multi-step ReAct loops, workflow marketplace |

---

## Contributing

Issues and pull requests are welcome. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) and [SECURITY.md](SECURITY.md).

## License

MIT — see [LICENSE](LICENSE).
