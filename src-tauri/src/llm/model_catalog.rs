/// Curated list of models available for one-click download from HuggingFace.
/// Each entry has a direct download URL, expected file size, and metadata.

pub struct CatalogEntry {
    pub name: &'static str,
    pub display_name: &'static str,
    pub description: &'static str,
    pub tags: &'static [&'static str],
    pub parameter_size: &'static str,
    pub quant: &'static str,
    /// Filename saved to the models/ directory
    pub gguf_filename: &'static str,
    /// Direct HuggingFace Hub download URL (no login required)
    pub download_url: &'static str,
    /// Approximate file size in bytes (shown to user before download)
    pub size_bytes: u64,
    /// Minimum RAM recommended (in GB)
    pub min_ram_gb: u8,
}

pub const CATALOG: &[CatalogEntry] = &[
    // -------------------------------------------------------------------------
    // 2–4 GB RAM  (1B – 4B)
    // -------------------------------------------------------------------------
    CatalogEntry {
        name: "llama3.2:1b",
        display_name: "Llama 3.2 1B",
        description: "Fastest local model — great for quick replies and low-end hardware. Runs well on CPU.",
        tags: &["chat", "fast", "cpu"],
        parameter_size: "1B",
        quant: "Q4_K_M",
        gguf_filename: "Llama-3.2-1B-Instruct-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf",
        size_bytes: 770_000_000,
        min_ram_gb: 2,
    },
    CatalogEntry {
        name: "gemma2:2b",
        display_name: "Gemma 2 2B",
        description: "Google's lightweight model — surprisingly capable for its tiny footprint.",
        tags: &["chat", "fast", "google"],
        parameter_size: "2B",
        quant: "Q4_K_M",
        gguf_filename: "gemma-2-2b-it-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/gemma-2-2b-it-GGUF/resolve/main/gemma-2-2b-it-Q4_K_M.gguf",
        size_bytes: 1_650_000_000,
        min_ram_gb: 4,
    },
    CatalogEntry {
        name: "llama3.2:3b",
        display_name: "Llama 3.2 3B",
        description: "Best balance of speed and quality for everyday chat. Recommended starting point.",
        tags: &["chat", "general", "recommended"],
        parameter_size: "3B",
        quant: "Q4_K_M",
        gguf_filename: "Llama-3.2-3B-Instruct-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q4_K_M.gguf",
        size_bytes: 2_020_000_000,
        min_ram_gb: 4,
    },
    CatalogEntry {
        name: "phi3:mini",
        display_name: "Phi-3 Mini",
        description: "Microsoft's compact model — excellent reasoning for its size, great on CPU.",
        tags: &["chat", "reasoning", "cpu", "microsoft"],
        parameter_size: "3.8B",
        quant: "Q4_K_M",
        gguf_filename: "Phi-3-mini-4k-instruct-q4.gguf",
        download_url: "https://huggingface.co/microsoft/Phi-3-mini-4k-instruct-gguf/resolve/main/Phi-3-mini-4k-instruct-q4.gguf",
        size_bytes: 2_180_000_000,
        min_ram_gb: 4,
    },
    CatalogEntry {
        name: "qwen3:4b",
        display_name: "Qwen 3 4B",
        description: "Latest Qwen with hybrid thinking mode — punches above its weight class.",
        tags: &["chat", "reasoning", "thinking", "fast"],
        parameter_size: "4B",
        quant: "Q4_K_M",
        gguf_filename: "Qwen3-4B-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/Qwen3-4B-GGUF/resolve/main/Qwen3-4B-Q4_K_M.gguf",
        size_bytes: 2_600_000_000,
        min_ram_gb: 4,
    },

    // -------------------------------------------------------------------------
    // 8 GB RAM  (7B – 9B)
    // -------------------------------------------------------------------------
    CatalogEntry {
        name: "mistral:7b",
        display_name: "Mistral 7B",
        description: "Strong general-purpose model — solid at coding, writing, and analysis.",
        tags: &["chat", "coding", "general"],
        parameter_size: "7B",
        quant: "Q4_K_M",
        gguf_filename: "mistral-7b-instruct-v0.2.Q4_K_M.gguf",
        download_url: "https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf",
        size_bytes: 4_370_000_000,
        min_ram_gb: 8,
    },
    CatalogEntry {
        name: "llama3.1:8b",
        display_name: "Llama 3.1 8B",
        description: "Meta's flagship 8B — best quality in its class with a 128K context window.",
        tags: &["chat", "reasoning", "quality", "meta"],
        parameter_size: "8B",
        quant: "Q4_K_M",
        gguf_filename: "Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/Meta-Llama-3.1-8B-Instruct-GGUF/resolve/main/Meta-Llama-3.1-8B-Instruct-Q4_K_M.gguf",
        size_bytes: 4_920_000_000,
        min_ram_gb: 8,
    },
    CatalogEntry {
        name: "qwen2.5:7b",
        display_name: "Qwen 2.5 7B",
        description: "Alibaba's multilingual model — excellent at coding, math, and structured output.",
        tags: &["chat", "coding", "multilingual", "math"],
        parameter_size: "7B",
        quant: "Q4_K_M",
        gguf_filename: "Qwen2.5-7B-Instruct-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/Qwen2.5-7B-Instruct-GGUF/resolve/main/Qwen2.5-7B-Instruct-Q4_K_M.gguf",
        size_bytes: 4_680_000_000,
        min_ram_gb: 8,
    },
    CatalogEntry {
        name: "qwen3:8b",
        display_name: "Qwen 3 8B",
        description: "Latest Qwen with optional deep-thinking mode. Great coding and multilingual support.",
        tags: &["chat", "coding", "thinking", "multilingual"],
        parameter_size: "8B",
        quant: "Q4_K_M",
        gguf_filename: "Qwen3-8B-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/Qwen3-8B-GGUF/resolve/main/Qwen3-8B-Q4_K_M.gguf",
        size_bytes: 5_200_000_000,
        min_ram_gb: 8,
    },
    CatalogEntry {
        name: "deepseek-r1:7b",
        display_name: "DeepSeek R1 7B",
        description: "Reasoning-focused with chain-of-thought. Shows its thinking process step by step.",
        tags: &["reasoning", "math", "thinking"],
        parameter_size: "7B",
        quant: "Q4_K_M",
        gguf_filename: "DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-7B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-7B-Q4_K_M.gguf",
        size_bytes: 4_680_000_000,
        min_ram_gb: 8,
    },
    CatalogEntry {
        name: "gemma2:9b",
        display_name: "Gemma 2 9B",
        description: "Google's 9B model — top-tier quality for its size, beats many 13B models.",
        tags: &["chat", "quality", "google"],
        parameter_size: "9B",
        quant: "Q4_K_M",
        gguf_filename: "gemma-2-9b-it-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/gemma-2-9b-it-GGUF/resolve/main/gemma-2-9b-it-Q4_K_M.gguf",
        size_bytes: 5_440_000_000,
        min_ram_gb: 8,
    },

    // -------------------------------------------------------------------------
    // 10–12 GB RAM  (11B – 14B)
    // -------------------------------------------------------------------------
    CatalogEntry {
        name: "gemma3:12b",
        display_name: "Gemma 3 12B",
        description: "Google's latest — multimodal-trained, strong at instruction-following and STEM.",
        tags: &["chat", "quality", "google", "reasoning"],
        parameter_size: "12B",
        quant: "Q4_K_M",
        gguf_filename: "gemma-3-12b-it-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/gemma-3-12b-it-GGUF/resolve/main/gemma-3-12b-it-Q4_K_M.gguf",
        size_bytes: 7_800_000_000,
        min_ram_gb: 10,
    },
    CatalogEntry {
        name: "mistral-nemo:12b",
        display_name: "Mistral Nemo 12B",
        description: "Mistral × NVIDIA — strong coding and function calling, 128K context.",
        tags: &["chat", "coding", "general"],
        parameter_size: "12B",
        quant: "Q4_K_M",
        gguf_filename: "Mistral-Nemo-Instruct-2407-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/Mistral-Nemo-Instruct-2407-GGUF/resolve/main/Mistral-Nemo-Instruct-2407-Q4_K_M.gguf",
        size_bytes: 7_200_000_000,
        min_ram_gb: 10,
    },
    CatalogEntry {
        name: "phi4:14b",
        display_name: "Phi-4 14B",
        description: "Microsoft's best local model — exceptional reasoning and math, beats many 70B models.",
        tags: &["reasoning", "math", "coding", "quality", "microsoft"],
        parameter_size: "14B",
        quant: "Q4_K_M",
        gguf_filename: "phi-4-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/phi-4-GGUF/resolve/main/phi-4-Q4_K_M.gguf",
        size_bytes: 8_900_000_000,
        min_ram_gb: 12,
    },
    CatalogEntry {
        name: "qwen2.5:14b",
        display_name: "Qwen 2.5 14B",
        description: "Strong at coding, math, and multilingual tasks. Among the best 14B models available.",
        tags: &["chat", "coding", "math", "multilingual"],
        parameter_size: "14B",
        quant: "Q4_K_M",
        gguf_filename: "Qwen2.5-14B-Instruct-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/Qwen2.5-14B-Instruct-GGUF/resolve/main/Qwen2.5-14B-Instruct-Q4_K_M.gguf",
        size_bytes: 9_400_000_000,
        min_ram_gb: 12,
    },
    CatalogEntry {
        name: "qwen3:14b",
        display_name: "Qwen 3 14B",
        description: "Latest Qwen 14B with thinking mode — excellent at complex reasoning and code.",
        tags: &["reasoning", "coding", "thinking", "quality"],
        parameter_size: "14B",
        quant: "Q4_K_M",
        gguf_filename: "Qwen3-14B-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/Qwen3-14B-GGUF/resolve/main/Qwen3-14B-Q4_K_M.gguf",
        size_bytes: 9_000_000_000,
        min_ram_gb: 12,
    },
    CatalogEntry {
        name: "deepseek-r1:14b",
        display_name: "DeepSeek R1 14B",
        description: "Powerful reasoning model — deep chain-of-thought for math, science, and coding.",
        tags: &["reasoning", "math", "thinking", "coding"],
        parameter_size: "14B",
        quant: "Q4_K_M",
        gguf_filename: "DeepSeek-R1-Distill-Qwen-14B-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/DeepSeek-R1-Distill-Qwen-14B-GGUF/resolve/main/DeepSeek-R1-Distill-Qwen-14B-Q4_K_M.gguf",
        size_bytes: 9_300_000_000,
        min_ram_gb: 12,
    },

    // -------------------------------------------------------------------------
    // 16 GB RAM  (20B – 24B)
    // -------------------------------------------------------------------------
    CatalogEntry {
        name: "mistral-small:22b",
        display_name: "Mistral Small 22B",
        description: "Mistral's best open model — near-GPT-4 quality at 22B. Great writing and reasoning.",
        tags: &["chat", "quality", "reasoning", "writing"],
        parameter_size: "22B",
        quant: "Q4_K_M",
        gguf_filename: "Mistral-Small-Instruct-2409-Q4_K_M.gguf",
        download_url: "https://huggingface.co/bartowski/Mistral-Small-Instruct-2409-GGUF/resolve/main/Mistral-Small-Instruct-2409-Q4_K_M.gguf",
        size_bytes: 13_500_000_000,
        min_ram_gb: 16,
    },
    CatalogEntry {
        name: "qwen2.5:32b",
        display_name: "Qwen 2.5 32B",
        description: "Top-tier open-source model — rivals GPT-4o on coding and math benchmarks.",
        tags: &["chat", "coding", "math", "quality", "best"],
        parameter_size: "32B",
        quant: "IQ2_M",
        gguf_filename: "Qwen2.5-32B-Instruct-IQ2_M.gguf",
        download_url: "https://huggingface.co/bartowski/Qwen2.5-32B-Instruct-GGUF/resolve/main/Qwen2.5-32B-Instruct-IQ2_M.gguf",
        size_bytes: 10_800_000_000,
        min_ram_gb: 16,
    },
];

/// Find a catalog entry by model name.
pub fn find(name: &str) -> Option<&'static CatalogEntry> {
    CATALOG.iter().find(|e| e.name == name)
}

/// Search the catalog by query string.
pub fn search(query: &str) -> Vec<&'static CatalogEntry> {
    let q = query.trim().to_lowercase();
    if q.is_empty() {
        return CATALOG.iter().collect();
    }
    CATALOG
        .iter()
        .filter(|e| {
            e.name.contains(&q)
                || e.display_name.to_lowercase().contains(&q)
                || e.description.to_lowercase().contains(&q)
                || e.tags.iter().any(|t| t.contains(&q))
                || e.parameter_size.to_lowercase().contains(&q)
        })
        .collect()
}
