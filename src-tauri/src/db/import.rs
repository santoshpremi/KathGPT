use serde::Deserialize;
use sqlx::SqlitePool;
use std::collections::HashMap;
use std::path::Path;
use tracing::info;

use super::repos::{chats, provider_keys};

#[derive(Debug, Deserialize)]
struct LegacyState {
    #[serde(default)]
    chats: Vec<LegacyChat>,
    #[serde(default)]
    messages: HashMap<String, Vec<LegacyMessage>>,
    #[serde(default)]
    provider_keys: LegacyProviderKeys,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyChat {
    id: String,
    name: Option<String>,
    created_at: String,
    updated_at: String,
    #[serde(default)]
    hidden: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct LegacyMessage {
    id: String,
    content: String,
    created_at: String,
    from_ai: bool,
    #[serde(default)]
    generation_model: Option<String>,
    #[serde(default)]
    response_completed: Option<bool>,
    #[serde(default)]
    cancelled: Option<bool>,
    #[serde(default)]
    attachment_ids: Vec<String>,
    #[serde(default)]
    citations: Vec<String>,
}

#[derive(Debug, Default, Deserialize)]
struct LegacyProviderKeys {
    #[serde(default)]
    openrouter: String,
    #[serde(default)]
    openai: String,
    #[serde(default)]
    anthropic: String,
    #[serde(default)]
    gemini: String,
    #[serde(default)]
    perplexity: String,
}

pub async fn import_legacy_if_needed(pool: &SqlitePool) -> anyhow::Result<()> {
    // Only runs in debug/dev builds. Release builds always start with a clean DB.
    if !cfg!(debug_assertions) {
        return Ok(());
    }

    let chat_count = chats::count(pool).await?;
    if chat_count > 0 {
        return Ok(());
    }

    let legacy_path = Path::new(env!("CARGO_MANIFEST_DIR")).join("../.data/dev-store.json");
    if !legacy_path.exists() {
        return Ok(());
    }

    info!("Importing legacy dev store from {}", legacy_path.display());
    let raw = std::fs::read_to_string(&legacy_path)?;
    let state: LegacyState = serde_json::from_str(&raw)?;

    for (provider, key) in [
        ("openrouter", state.provider_keys.openrouter.as_str()),
        ("openai", state.provider_keys.openai.as_str()),
        ("anthropic", state.provider_keys.anthropic.as_str()),
        ("gemini", state.provider_keys.gemini.as_str()),
        ("perplexity", state.provider_keys.perplexity.as_str()),
    ] {
        if !key.trim().is_empty() {
            provider_keys::set_key(pool, provider, key).await?;
        }
    }

    for chat in state.chats {
        if chat.hidden {
            continue;
        }
        sqlx::query(
            "INSERT OR IGNORE INTO chats (id, name, hidden, created_at, updated_at) VALUES (?, ?, 0, ?, ?)",
        )
        .bind(&chat.id)
        .bind(&chat.name)
        .bind(&chat.created_at)
        .bind(&chat.updated_at)
        .execute(pool)
        .await?;
    }

    for (chat_id, msgs) in state.messages {
        for msg in msgs {
            let attachments = serde_json::to_string(&msg.attachment_ids)?;
            let citations = serde_json::to_string(&msg.citations)?;
            sqlx::query(
                "INSERT OR IGNORE INTO messages (id, chat_id, content, from_ai, generation_model,
                 response_completed, cancelled, attachment_ids, citations, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            )
            .bind(&msg.id)
            .bind(&chat_id)
            .bind(&msg.content)
            .bind(msg.from_ai as i64)
            .bind(&msg.generation_model)
            .bind(msg.response_completed.unwrap_or(true) as i64)
            .bind(msg.cancelled.unwrap_or(false) as i64)
            .bind(attachments)
            .bind(citations)
            .bind(&msg.created_at)
            .execute(pool)
            .await?;
        }
    }

    info!("Legacy import complete");
    Ok(())
}
