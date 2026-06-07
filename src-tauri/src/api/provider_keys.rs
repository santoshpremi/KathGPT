use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{delete, get, post},
    Json, Router,
};
use reqwest::Client;

use crate::db::repos::provider_keys as repo;
use crate::models::{ProviderKeyStatus, SetProviderKeyRequest, TestProviderKeyRequest, TestProviderKeyResponse, PROVIDER_IDS};
use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/provider-keys/status", get(get_status))
        .route("/provider-keys/set", post(set_key))
        .route("/provider-keys/{provider}", delete(clear_key))
        .route("/provider-keys/test", post(test_connection))
}

fn is_known_provider(provider: &str) -> bool {
    PROVIDER_IDS.contains(&provider)
}

async fn get_status(State(state): State<AppState>) -> impl IntoResponse {
    match repo::get_status(&state.db).await {
        Ok(status) => (StatusCode::OK, Json(status)).into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn set_key(
    State(state): State<AppState>,
    Json(body): Json<SetProviderKeyRequest>,
) -> impl IntoResponse {
    if !is_known_provider(&body.provider) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Unknown provider" })),
        )
            .into_response();
    }
    if body.api_key.trim().len() < 8 {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "API key too short" })),
        )
            .into_response();
    }

    match repo::set_key(&state.db, &body.provider, &body.api_key).await {
        Ok(()) => match repo::get_status(&state.db).await {
            Ok(statuses) => {
                let item = statuses
                    .into_iter()
                    .find(|s| s.id == body.provider)
                    .unwrap_or(ProviderKeyStatus {
                        id: body.provider.clone(),
                        configured: true,
                        source: "stored".to_string(),
                        masked_key: Some(repo::mask_api_key(&body.api_key)),
                    });
                (StatusCode::OK, Json(item)).into_response()
            }
            Err(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": err.to_string() })),
            )
                .into_response(),
        },
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn clear_key(
    State(state): State<AppState>,
    Path(provider): Path<String>,
) -> impl IntoResponse {
    if !is_known_provider(&provider) {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Unknown provider" })),
        )
            .into_response();
    }

    match repo::clear_key(&state.db, &provider).await {
        Ok(()) => match repo::get_status(&state.db).await {
            Ok(statuses) => {
                let item = statuses.into_iter().find(|s| s.id == provider);
                (StatusCode::OK, Json(item)).into_response()
            }
            Err(err) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": err.to_string() })),
            )
                .into_response(),
        },
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn test_connection(
    State(state): State<AppState>,
    Json(body): Json<TestProviderKeyRequest>,
) -> impl IntoResponse {
    if !is_known_provider(&body.provider) {
        return (
            StatusCode::BAD_REQUEST,
            Json(TestProviderKeyResponse {
                ok: false,
                message: "Unknown provider".to_string(),
            }),
        )
            .into_response();
    }

    let key = match &body.api_key {
        Some(k) if k.trim().len() >= 8 => k.trim().to_string(),
        _ => match repo::effective_key(&state.db, &body.provider).await {
            Ok(Some(k)) => k,
            Ok(None) => {
                return (
                    StatusCode::OK,
                    Json(TestProviderKeyResponse {
                        ok: false,
                        message: "No API key provided".to_string(),
                    }),
                )
                    .into_response()
            }
            Err(err) => {
                return (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(TestProviderKeyResponse {
                        ok: false,
                        message: err.to_string(),
                    }),
                )
                    .into_response()
            }
        },
    };

    let result = test_provider_http(&body.provider, &key).await;
    (StatusCode::OK, Json(result)).into_response()
}

async fn test_provider_http(provider: &str, key: &str) -> TestProviderKeyResponse {
    let client = Client::new();
    let result = match provider {
        "openrouter" => {
            client
                .post("https://openrouter.ai/api/v1/chat/completions")
                .bearer_auth(key)
                .json(&serde_json::json!({
                    "model": "openrouter/auto",
                    "max_tokens": 1,
                    "messages": [{ "role": "user", "content": "Hi" }]
                }))
                .send()
                .await
        }
        "openai" => {
            client
                .get("https://api.openai.com/v1/models")
                .bearer_auth(key)
                .send()
                .await
        }
        "anthropic" => {
            client
                .post("https://api.anthropic.com/v1/messages")
                .header("x-api-key", key)
                .header("anthropic-version", "2023-06-01")
                .json(&serde_json::json!({
                    "model": "claude-3-5-haiku-20241022",
                    "max_tokens": 16,
                    "messages": [{ "role": "user", "content": "Hi" }]
                }))
                .send()
                .await
        }
        "gemini" => {
            client
                .get(format!(
                    "https://generativelanguage.googleapis.com/v1beta/models?key={key}"
                ))
                .send()
                .await
        }
        "perplexity" => {
            client
                .post("https://api.perplexity.ai/chat/completions")
                .bearer_auth(key)
                .json(&serde_json::json!({
                    "model": "sonar",
                    "max_tokens": 16,
                    "messages": [{ "role": "user", "content": "Hi" }]
                }))
                .send()
                .await
        }
        _ => {
            return TestProviderKeyResponse {
                ok: false,
                message: "Unknown provider".to_string(),
            }
        }
    };

    match result {
        Ok(res) if res.status().is_success() => TestProviderKeyResponse {
            ok: true,
            message: format!("{provider} connection successful"),
        },
        Ok(res) => {
            let status = res.status();
            let message = res.text().await.unwrap_or_else(|_| status.to_string());
            TestProviderKeyResponse {
                ok: false,
                message,
            }
        }
        Err(err) => TestProviderKeyResponse {
            ok: false,
            message: err.to_string(),
        },
    }
}
