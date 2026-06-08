use sqlx::SqlitePool;

use super::models::{openrouter_slug, DirectModel, DEFAULT_MODEL, ENABLED_MODELS};
use crate::db::repos::provider_keys::{effective_key, has_any_stored_provider, has_stored_key};

pub enum ModelRoute {
    OpenRouter { slug: String },
    Direct { provider: String, slug: String },
    Local { model: String },
}

pub async fn resolve_generation_model(
    pool: &SqlitePool,
    model_override: Option<&str>,
) -> anyhow::Result<String> {
    if let Some(m) = model_override {
        if m != "automatic" {
            return Ok(m.to_string());
        }
    }

    let available = get_available_models(pool).await?;
    if available.iter().any(|m| m == DEFAULT_MODEL) {
        return Ok(DEFAULT_MODEL.to_string());
    }
    Ok(available
        .first()
        .cloned()
        .unwrap_or_else(|| DEFAULT_MODEL.to_string()))
}

pub async fn get_available_models(pool: &SqlitePool) -> anyhow::Result<Vec<String>> {
    if !has_any_stored_provider(pool).await? {
        return Ok(vec![]);
    }

    let openrouter = has_stored_key(pool, "openrouter").await?;
    let mut out = Vec::new();
    for model in ENABLED_MODELS {
        if openrouter {
            if openrouter_slug(model).is_some() {
                out.push(model.to_string());
            }
        } else if let Some(direct) = super::models::direct_model(model) {
            if has_stored_key(pool, direct.provider).await? {
                out.push(model.to_string());
            }
        }
    }
    Ok(out)
}

fn parse_local_model(model: &str) -> Option<&str> {
    model.strip_prefix("local:").filter(|slug| !slug.is_empty())
}

fn parse_prefixed_provider_model(model: &str) -> Option<(&str, &str)> {
    for provider in ["openrouter", "openai", "anthropic", "gemini", "perplexity"] {
        let prefix = format!("{provider}:");
        if let Some(slug) = model.strip_prefix(&prefix) {
            if !slug.is_empty() {
                return Some((provider, slug));
            }
        }
    }
    None
}

pub async fn resolve_model_route(
    pool: &SqlitePool,
    model: &str,
) -> anyhow::Result<Option<ModelRoute>> {
    if let Some(local_model) = parse_local_model(model) {
        // Route through sidecar regardless of whether it's currently running —
        // the stream handler will call ensure_running which boots it on demand.
        if super::sidecar::model_downloaded(local_model) {
            return Ok(Some(ModelRoute::Local {
                model: local_model.to_string(),
            }));
        }
    }

    if let Some((provider, slug)) = parse_prefixed_provider_model(model) {
        if effective_key(pool, provider).await?.is_some() {
            if provider == "openrouter" {
                return Ok(Some(ModelRoute::OpenRouter {
                    slug: slug.to_string(),
                }));
            }
            return Ok(Some(ModelRoute::Direct {
                provider: provider.to_string(),
                slug: slug.to_string(),
            }));
        }
    }

    if effective_key(pool, "openrouter").await?.is_some() {
        if let Some(slug) = openrouter_slug(model) {
            return Ok(Some(ModelRoute::OpenRouter {
                slug: slug.to_string(),
            }));
        }
    }

    if let Some(DirectModel { provider, slug }) = super::models::direct_model(model) {
        if effective_key(pool, provider).await?.is_some() {
            return Ok(Some(ModelRoute::Direct {
                provider: provider.to_string(),
                slug: slug.to_string(),
            }));
        }
    }

    Ok(None)
}
