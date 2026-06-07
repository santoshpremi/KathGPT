use reqwest::Client;
use sqlx::SqlitePool;

use crate::db::repos::provider_keys::effective_key;

pub async fn translate_text(
    pool: &SqlitePool,
    text: &str,
    source_language: Option<&str>,
    target_language: &str,
) -> anyhow::Result<String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        anyhow::bail!("Text is required");
    }

    let openrouter_key = effective_key(pool, "openrouter").await?;
    let openai_key = effective_key(pool, "openai").await?;
    let use_openrouter = openrouter_key.is_some();
    let key = openrouter_key
        .or(openai_key)
        .ok_or_else(|| anyhow::anyhow!("Configure OpenRouter or OpenAI API key to translate"))?;

    let target = language_label(target_language);
    let source_hint = match source_language.filter(|s| *s != "auto" && !s.is_empty()) {
        Some(src) => format!("from {}", language_label(src)),
        None => String::new(),
    };

    let system = format!(
        "You are a professional translator. Translate the user's text {source_hint} into {target}. \
         Return only the translated text, without quotes or commentary."
    )
    .trim()
    .to_string();

    let (url, model, headers): (&str, &str, Vec<(&str, &str)>) = if use_openrouter {
        (
            "https://openrouter.ai/api/v1/chat/completions",
            "openai/gpt-4o-mini",
            vec![
                ("HTTP-Referer", "http://localhost:17890"),
                ("X-Title", "KathGPT"),
            ],
        )
    } else {
        ("https://api.openai.com/v1/chat/completions", "gpt-4o-mini", vec![])
    };

    let client = Client::new();
    let body = serde_json::json!({
        "model": model,
        "messages": [
            { "role": "system", "content": system },
            { "role": "user", "content": trimmed }
        ],
        "max_tokens": 4096,
        "temperature": 0.2,
    });

    let mut req = client.post(url).bearer_auth(&key).json(&body);
    for (k, v) in headers {
        req = req.header(k, v);
    }

    let response = req.send().await?;
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        anyhow::bail!("Translation failed ({status}): {text}");
    }

    let payload: serde_json::Value = response.json().await?;
    let translated = payload["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("No translation in response"))?
        .trim()
        .to_string();
    Ok(translated)
}

/// Translate document text while preserving structure (headings, lists, tables).
pub async fn translate_document_text(
    pool: &SqlitePool,
    text: &str,
    source_language: Option<&str>,
    target_language: &str,
) -> anyhow::Result<String> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        anyhow::bail!("Text is required");
    }

    let openrouter_key = effective_key(pool, "openrouter").await?;
    let openai_key = effective_key(pool, "openai").await?;
    let use_openrouter = openrouter_key.is_some();
    let key = openrouter_key
        .or(openai_key)
        .ok_or_else(|| anyhow::anyhow!("Configure OpenRouter or OpenAI API key to translate"))?;

    let target = language_label(target_language);
    let source_hint = match source_language.filter(|s| *s != "auto" && !s.is_empty()) {
        Some(src) => format!("from {}", language_label(src)),
        None => String::new(),
    };

    let system = format!(
        "You are a professional academic document translator. Translate the user's document {source_hint} into {target}. \
         Preserve structure exactly: title, section numbers (e.g. 1. Introduction), Abstract/Zusammenfassung headings, paragraph breaks, lists, and citations. \
         Keep one blank line between paragraphs. Do not merge sections. Do not add commentary. Return only the translated document."
    )
    .trim()
    .to_string();

    let (url, model, headers): (&str, &str, Vec<(&str, &str)>) = if use_openrouter {
        (
            "https://openrouter.ai/api/v1/chat/completions",
            "openai/gpt-4o-mini",
            vec![
                ("HTTP-Referer", "http://localhost:17890"),
                ("X-Title", "KathGPT"),
            ],
        )
    } else {
        ("https://api.openai.com/v1/chat/completions", "gpt-4o-mini", vec![])
    };

    let client = Client::new();
    let body = serde_json::json!({
        "model": model,
        "messages": [
            { "role": "system", "content": system },
            { "role": "user", "content": trimmed }
        ],
        "max_tokens": 8192,
        "temperature": 0.2,
    });

    let mut req = client.post(url).bearer_auth(&key).json(&body);
    for (k, v) in headers {
        req = req.header(k, v);
    }

    let response = req.send().await?;
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        anyhow::bail!("Translation failed ({status}): {text}");
    }

    let payload: serde_json::Value = response.json().await?;
    let translated = payload["choices"][0]["message"]["content"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("No translation in response"))?
        .trim()
        .to_string();
    Ok(translated)
}

fn language_label(code: &str) -> String {
    match code {
        "auto" => "the detected source language".to_string(),
        "en" => "English".to_string(),
        "de" => "German".to_string(),
        "es" => "Spanish".to_string(),
        "fr" => "French".to_string(),
        "it" => "Italian".to_string(),
        "pt" => "Portuguese".to_string(),
        "nl" => "Dutch".to_string(),
        "pl" => "Polish".to_string(),
        "ru" => "Russian".to_string(),
        "zh" => "Chinese".to_string(),
        "ja" => "Japanese".to_string(),
        "ko" => "Korean".to_string(),
        "ar" => "Arabic".to_string(),
        "hi" => "Hindi".to_string(),
        "ne" => "Nepali".to_string(),
        other => other.to_string(),
    }
}
