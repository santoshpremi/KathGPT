use futures::stream::BoxStream;
use futures::StreamExt;
use reqwest::Client;
use serde::{Deserialize, Serialize};

pub const DEFAULT_BASE_URL: &str = "http://127.0.0.1:11434";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OllamaStatus {
    pub running: bool,
    pub base_url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledLocalModel {
    pub name: String,
    pub display_name: String,
    pub size_bytes: u64,
    pub parameter_size: Option<String>,
    pub quantization: Option<String>,
    pub family: Option<String>,
    pub modified_at: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogLocalModel {
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub tags: Vec<String>,
    pub parameter_size: Option<String>,
    pub installed: bool,
}

#[derive(Debug, Deserialize)]
struct TagsResponse {
    models: Vec<TagModel>,
}

#[derive(Debug, Deserialize)]
struct TagModel {
    name: String,
    #[serde(default)]
    size: u64,
    #[serde(default)]
    modified_at: Option<String>,
    details: Option<TagModelDetails>,
}

#[derive(Debug, Deserialize)]
struct TagModelDetails {
    #[serde(default)]
    parameter_size: Option<String>,
    #[serde(default)]
    quantization_level: Option<String>,
    #[serde(default)]
    family: Option<String>,
}

#[derive(Debug, Deserialize)]
struct VersionResponse {
    version: String,
}

pub struct CatalogEntry {
    pub name: &'static str,
    pub display_name: &'static str,
    pub description: &'static str,
    pub tags: &'static [&'static str],
    pub parameter_size: Option<&'static str>,
}

pub const CATALOG: &[CatalogEntry] = &[
    CatalogEntry {
        name: "llama3.2",
        display_name: "Llama 3.2",
        description: "Meta's latest general-purpose model — great balance of speed and quality.",
        tags: &["chat", "general"],
        parameter_size: Some("3B"),
    },
    CatalogEntry {
        name: "llama3.2:1b",
        display_name: "Llama 3.2 1B",
        description: "Ultra-lightweight — runs fast on CPU with minimal RAM.",
        tags: &["chat", "fast", "cpu"],
        parameter_size: Some("1B"),
    },
    CatalogEntry {
        name: "llama3.2:3b",
        display_name: "Llama 3.2 3B",
        description: "Compact model for everyday chat on modest hardware.",
        tags: &["chat", "general"],
        parameter_size: Some("3B"),
    },
    CatalogEntry {
        name: "llama3.1:8b",
        display_name: "Llama 3.1 8B",
        description: "Strong reasoning and instruction-following for local use.",
        tags: &["chat", "reasoning"],
        parameter_size: Some("8B"),
    },
    CatalogEntry {
        name: "mistral",
        display_name: "Mistral 7B",
        description: "Efficient European open model — strong at coding and chat.",
        tags: &["chat", "coding"],
        parameter_size: Some("7B"),
    },
    CatalogEntry {
        name: "mixtral",
        display_name: "Mixtral 8x7B",
        description: "Mixture-of-experts model — high quality, needs more VRAM.",
        tags: &["chat", "reasoning"],
        parameter_size: Some("47B"),
    },
    CatalogEntry {
        name: "phi3",
        display_name: "Phi-3",
        description: "Microsoft's small but capable model — excellent on CPU.",
        tags: &["chat", "fast", "cpu"],
        parameter_size: Some("3.8B"),
    },
    CatalogEntry {
        name: "gemma2:2b",
        display_name: "Gemma 2 2B",
        description: "Google's compact open model — low memory footprint.",
        tags: &["chat", "fast"],
        parameter_size: Some("2B"),
    },
    CatalogEntry {
        name: "gemma2:9b",
        display_name: "Gemma 2 9B",
        description: "Larger Gemma variant with stronger reasoning.",
        tags: &["chat", "reasoning"],
        parameter_size: Some("9B"),
    },
    CatalogEntry {
        name: "qwen2.5:7b",
        display_name: "Qwen 2.5 7B",
        description: "Alibaba's multilingual model — strong at coding and math.",
        tags: &["chat", "coding", "multilingual"],
        parameter_size: Some("7B"),
    },
    CatalogEntry {
        name: "deepseek-r1:7b",
        display_name: "DeepSeek R1 7B",
        description: "Reasoning-focused model with chain-of-thought capabilities.",
        tags: &["chat", "reasoning"],
        parameter_size: Some("7B"),
    },
    CatalogEntry {
        name: "codellama",
        display_name: "Code Llama",
        description: "Specialized for code generation and explanation.",
        tags: &["coding"],
        parameter_size: Some("7B"),
    },
    CatalogEntry {
        name: "llava",
        display_name: "LLaVA",
        description: "Vision-language model — describe and analyze images locally.",
        tags: &["vision", "multimodal"],
        parameter_size: Some("7B"),
    },
    CatalogEntry {
        name: "nomic-embed-text",
        display_name: "Nomic Embed Text",
        description: "Embedding model for local RAG and semantic search.",
        tags: &["embedding", "rag"],
        parameter_size: None,
    },
];

fn client() -> Client {
    Client::builder()
        .timeout(std::time::Duration::from_secs(300))
        .build()
        .unwrap_or_else(|_| Client::new())
}

pub async fn check_status(base_url: Option<&str>) -> OllamaStatus {
    let base = base_url.unwrap_or(DEFAULT_BASE_URL).trim_end_matches('/');
    let client = client();

    match client
        .get(format!("{base}/api/version"))
        .send()
        .await
    {
        Ok(res) if res.status().is_success() => {
            let version = res
                .json::<VersionResponse>()
                .await
                .ok()
                .map(|v| v.version);
            OllamaStatus {
                running: true,
                base_url: base.to_string(),
                version,
                error: None,
            }
        }
        Ok(res) => OllamaStatus {
            running: false,
            base_url: base.to_string(),
            version: None,
            error: Some(format!("Ollama returned HTTP {}", res.status())),
        },
        Err(err) => OllamaStatus {
            running: false,
            base_url: base.to_string(),
            version: None,
            error: Some(if err.is_connect() {
                "Ollama is not running. Install from ollama.com and run `ollama serve`.".to_string()
            } else {
                err.to_string()
            }),
        },
    }
}

pub async fn list_installed(base_url: Option<&str>) -> anyhow::Result<Vec<InstalledLocalModel>> {
    let base = base_url.unwrap_or(DEFAULT_BASE_URL).trim_end_matches('/');
    let client = client();
    let res = client
        .get(format!("{base}/api/tags"))
        .send()
        .await?;

    if !res.status().is_success() {
        anyhow::bail!("Ollama tags API error: {}", res.status());
    }

    let body = res.json::<TagsResponse>().await?;
    Ok(body
        .models
        .into_iter()
        .map(|m| {
            let display_name = m
                .name
                .split(':')
                .next()
                .unwrap_or(&m.name)
                .to_string();
            InstalledLocalModel {
                name: m.name.clone(),
                display_name,
                size_bytes: m.size,
                parameter_size: m.details.as_ref().and_then(|d| d.parameter_size.clone()),
                quantization: m
                    .details
                    .as_ref()
                    .and_then(|d| d.quantization_level.clone()),
                family: m.details.as_ref().and_then(|d| d.family.clone()),
                modified_at: m.modified_at,
            }
        })
        .collect())
}

pub fn search_catalog(query: &str, installed_names: &[String]) -> Vec<CatalogLocalModel> {
    let q = query.trim().to_lowercase();
    CATALOG
        .iter()
        .filter(|entry| {
            if q.is_empty() {
                return true;
            }
            entry.name.contains(&q)
                || entry.display_name.to_lowercase().contains(&q)
                || entry.description.to_lowercase().contains(&q)
                || entry.tags.iter().any(|t| t.to_lowercase().contains(&q))
        })
        .map(|entry| {
            let installed = installed_names.iter().any(|name| {
                name == entry.name
                    || name.starts_with(&format!("{}:", entry.name))
                    || entry.name.starts_with(name.as_str())
            });
            CatalogLocalModel {
                name: entry.name.to_string(),
                display_name: entry.display_name.to_string(),
                description: entry.description.to_string(),
                tags: entry.tags.iter().map(|t| t.to_string()).collect(),
                parameter_size: entry.parameter_size.map(|s| s.to_string()),
                installed,
            }
        })
        .collect()
}

pub async fn pull_model(base_url: Option<&str>, name: &str) -> anyhow::Result<()> {
    let base = base_url.unwrap_or(DEFAULT_BASE_URL).trim_end_matches('/');
    let client = client();
    let res = client
        .post(format!("{base}/api/pull"))
        .json(&serde_json::json!({ "name": name, "stream": false }))
        .send()
        .await?;

    if !res.status().is_success() {
        let text = res.text().await.unwrap_or_default();
        anyhow::bail!("Failed to download model: {text}");
    }
    Ok(())
}

pub async fn delete_model(base_url: Option<&str>, name: &str) -> anyhow::Result<()> {
    let base = base_url.unwrap_or(DEFAULT_BASE_URL).trim_end_matches('/');
    let client = client();
    let res = client
        .delete(format!("{base}/api/delete"))
        .json(&serde_json::json!({ "name": name }))
        .send()
        .await?;

    if !res.status().is_success() {
        let text = res.text().await.unwrap_or_default();
        anyhow::bail!("Failed to delete model: {text}");
    }
    Ok(())
}

pub async fn stream_chat(
    base_url: Option<&str>,
    model: &str,
    messages: &[super::models::ChatMessage],
    temperature: f32,
) -> anyhow::Result<BoxStream<'static, anyhow::Result<String>>> {
    let base = base_url.unwrap_or(DEFAULT_BASE_URL).trim_end_matches('/');
    let client = client();

    let ollama_messages: Vec<_> = messages
        .iter()
        .map(|m| {
            serde_json::json!({
                "role": m.role,
                "content": m.content,
            })
        })
        .collect();

    let res = client
        .post(format!("{base}/api/chat"))
        .json(&serde_json::json!({
            "model": model,
            "messages": ollama_messages,
            "stream": true,
            "options": { "temperature": temperature },
        }))
        .send()
        .await?;

    if !res.status().is_success() {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        anyhow::bail!("Ollama chat error ({status}): {text}");
    }

    Ok(async_stream::stream! {
        let mut byte_stream = std::pin::pin!(res.bytes_stream());
        let mut buffer = String::new();

        while let Some(chunk) = byte_stream.next().await {
            let chunk = chunk?;
            buffer.push_str(&String::from_utf8_lossy(&chunk));

            while let Some(pos) = buffer.find('\n') {
                let line = buffer[..pos].trim().to_string();
                buffer = buffer[pos + 1..].to_string();
                if line.is_empty() {
                    continue;
                }
                if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&line) {
                    if let Some(content) = parsed["message"]["content"].as_str() {
                        if !content.is_empty() {
                            yield Ok(content.to_string());
                        }
                    }
                    if parsed["done"].as_bool() == Some(true) {
                        return;
                    }
                }
            }
        }
    }
    .boxed())
}
