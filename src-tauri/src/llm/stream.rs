use futures::stream::BoxStream;
use futures::StreamExt;
use reqwest::Client;
use sqlx::SqlitePool;

use super::models::ChatMessage;
use super::router::{resolve_model_route, ModelRoute};
use crate::db::repos::provider_keys::{effective_key, has_any_provider};

pub struct StreamOptions {
    pub messages: Vec<ChatMessage>,
    pub temperature: f32,
    pub max_tokens: u32,
}

pub async fn stream_completion(
    pool: &SqlitePool,
    generation_model: &str,
    options: StreamOptions,
) -> anyhow::Result<BoxStream<'static, anyhow::Result<String>>> {
    let route = resolve_model_route(pool, generation_model).await?;

    if let Some(route) = route {
        return match route {
            ModelRoute::OpenRouter { slug } => {
                let key = effective_key(pool, "openrouter")
                    .await?
                    .ok_or_else(|| {
                        anyhow::anyhow!(
                            "OpenRouter API key missing or could not be decrypted — re-save it in Settings → API Keys"
                        )
                    })?;
                Ok(stream_openai_compatible(
                    "https://openrouter.ai/api/v1/chat/completions",
                    &key,
                    &slug,
                    options,
                    Some(("HTTP-Referer", "http://localhost:17890")),
                    Some(("X-Title", "KathaGPT")),
                )
                .await?)
            }
            ModelRoute::Local { model } => {
                // Boot the sidecar (or switch models) then call its OpenAI-compat API
                super::sidecar::ensure_running(&model).await?;
                Ok(stream_openai_compatible(
                    &format!("{}/v1/chat/completions", super::sidecar::SIDECAR_BASE_URL),
                    "local",   // llama-server ignores the Bearer token
                    &model,
                    options,
                    None,
                    None,
                )
                .await?)
            }
            ModelRoute::Direct { provider, slug } => {
                let key = effective_key(pool, &provider)
                    .await?
                    .ok_or_else(|| anyhow::anyhow!("{provider} key missing"))?;
                match provider.as_str() {
                    "openai" => Ok(stream_openai_compatible(
                        "https://api.openai.com/v1/chat/completions",
                        &key,
                        &slug,
                        options,
                        None,
                        None,
                    )
                    .await?),
                    "perplexity" => Ok(stream_openai_compatible(
                        "https://api.perplexity.ai/chat/completions",
                        &key,
                        &slug,
                        options,
                        None,
                        None,
                    )
                    .await?),
                    "anthropic" => Ok(stream_anthropic(&key, &slug, options).await?),
                    "gemini" => Ok(stream_gemini(&key, &slug, options).await?),
                    _ => anyhow::bail!("Unsupported provider: {provider}"),
                }
            }
        };
    }

    if !has_any_provider(pool).await? {
        let prompt = options
            .messages
            .iter()
            .rev()
            .find(|m| m.role == "user")
            .map(|m| m.content.as_str())
            .unwrap_or("Hello");
        let text = format!(
            "I'm running in development mode without an API key. Configure provider keys in Settings → API Keys. You said: \"{prompt}\""
        );
        return Ok(futures::stream::iter(vec![Ok(text)]).boxed());
    }

    anyhow::bail!(
        "No API key configured for {generation_model}. Add OpenRouter or the matching provider key."
    )
}

async fn stream_openai_compatible(
    url: &str,
    api_key: &str,
    model: &str,
    options: StreamOptions,
    extra1: Option<(&str, &str)>,
    extra2: Option<(&str, &str)>,
) -> anyhow::Result<BoxStream<'static, anyhow::Result<String>>> {
    let client = Client::new();
    let body = serde_json::json!({
        "model": model,
        "messages": options.messages,
        "temperature": options.temperature,
        "max_tokens": options.max_tokens,
        "stream": true,
    });

    let api_key = api_key.trim();
    if api_key.is_empty() {
        anyhow::bail!("API key is empty");
    }

    let mut req = client
        .post(url)
        .header("Authorization", format!("Bearer {api_key}"))
        .header("Content-Type", "application/json")
        .json(&body);

    if let Some((k, v)) = extra1 {
        req = req.header(k, v);
    }
    if let Some((k, v)) = extra2 {
        req = req.header(k, v);
    }

    let response = req.send().await?;
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        anyhow::bail!("API error ({status}): {text}");
    }

    Ok(parse_openai_sse(response.bytes_stream()))
}

fn parse_openai_sse(
    byte_stream: impl futures::Stream<Item = Result<bytes::Bytes, reqwest::Error>> + Send + 'static,
) -> BoxStream<'static, anyhow::Result<String>> {
    async_stream::stream! {
        let mut byte_stream = std::pin::pin!(byte_stream);
        let mut buffer = String::new();

        while let Some(chunk) = byte_stream.next().await {
            let chunk = chunk?;
            buffer.push_str(&String::from_utf8_lossy(&chunk));

            while let Some(pos) = buffer.find('\n') {
                let line = buffer[..pos].trim().to_string();
                buffer = buffer[pos + 1..].to_string();

                if !line.starts_with("data:") {
                    continue;
                }
                let payload = line.trim_start_matches("data:").trim();
                if payload == "[DONE]" {
                    return;
                }
                if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(payload) {
                    if let Some(delta) = parsed["choices"][0]["delta"]["content"].as_str() {
                        yield Ok(delta.to_string());
                    }
                }
            }
        }
    }
    .boxed()
}

async fn stream_anthropic(
    api_key: &str,
    model: &str,
    options: StreamOptions,
) -> anyhow::Result<BoxStream<'static, anyhow::Result<String>>> {
    let system: String = options
        .messages
        .iter()
        .filter(|m| m.role == "system")
        .map(|m| m.content.as_str())
        .collect::<Vec<_>>()
        .join("\n\n");

    let messages: Vec<_> = options
        .messages
        .iter()
        .filter(|m| m.role != "system")
        .map(|m| {
            serde_json::json!({
                "role": m.role,
                "content": m.content,
            })
        })
        .collect();

    let client = Client::new();
    let mut body = serde_json::json!({
        "model": model,
        "max_tokens": options.max_tokens,
        "temperature": options.temperature,
        "messages": messages,
        "stream": true,
    });
    if !system.is_empty() {
        body["system"] = serde_json::Value::String(system);
    }

    let response = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&body)
        .send()
        .await?;

    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        anyhow::bail!("Anthropic API error ({status}): {text}");
    }

    Ok(async_stream::stream! {
        let mut byte_stream = std::pin::pin!(response.bytes_stream());
        let mut buffer = String::new();
        while let Some(chunk) = byte_stream.next().await {
            let chunk = chunk?;
            buffer.push_str(&String::from_utf8_lossy(&chunk));
            while let Some(pos) = buffer.find('\n') {
                let line = buffer[..pos].to_string();
                buffer = buffer[pos + 1..].to_string();
                if let Some(data) = line.strip_prefix("data: ") {
                    if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(data) {
                        if parsed["type"] == "content_block_delta" {
                            if let Some(text) = parsed["delta"]["text"].as_str() {
                                yield Ok(text.to_string());
                            }
                        }
                    }
                }
            }
        }
    }
    .boxed())
}

async fn stream_gemini(
    api_key: &str,
    model: &str,
    options: StreamOptions,
) -> anyhow::Result<BoxStream<'static, anyhow::Result<String>>> {
    let url = format!(
        "https://generativelanguage.googleapis.com/v1beta/models/{model}:streamGenerateContent?alt=sse&key={api_key}"
    );

    let system: String = options
        .messages
        .iter()
        .filter(|m| m.role == "system")
        .map(|m| m.content.as_str())
        .collect::<Vec<_>>()
        .join("\n\n");

    let contents: Vec<_> = options
        .messages
        .iter()
        .filter(|m| m.role != "system")
        .map(|m| {
            serde_json::json!({
                "role": if m.role == "assistant" { "model" } else { "user" },
                "parts": [{ "text": m.content }],
            })
        })
        .collect();

    let mut body = serde_json::json!({
        "contents": contents,
        "generationConfig": {
            "temperature": options.temperature,
            "maxOutputTokens": options.max_tokens,
        }
    });
    if !system.is_empty() {
        body["systemInstruction"] = serde_json::json!({ "parts": [{ "text": system }] });
    }

    let client = Client::new();
    let response = client.post(&url).json(&body).send().await?;
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        anyhow::bail!("Gemini API error ({status}): {text}");
    }

    Ok(parse_openai_sse(response.bytes_stream()))
}
