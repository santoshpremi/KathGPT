use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};

use crate::llm::models::ENABLED_MODELS;
use crate::llm::provider_models;
use crate::llm::router::get_available_models;
use crate::models::PROVIDER_IDS;
use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/model-config/enabled", get(get_enabled))
        .route("/model-config/available", get(get_available))
        .route("/model-config/provider-models/{provider}", get(get_provider_models))
        .route("/model-config/openrouter-models", get(get_openrouter_models))
}

fn is_known_provider(provider: &str) -> bool {
    PROVIDER_IDS.contains(&provider)
}

async fn get_enabled() -> impl IntoResponse {
    let models: Vec<&str> = ENABLED_MODELS.to_vec();
    (StatusCode::OK, Json(models))
}

async fn get_available(State(state): State<AppState>) -> impl IntoResponse {
    match get_available_models(&state.db).await {
        Ok(models) => (StatusCode::OK, Json(models)).into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn get_provider_models(
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

    match provider_models::fetch_models(&state.db, &provider).await {
        Ok(models) => (StatusCode::OK, Json(models)).into_response(),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn get_openrouter_models(State(state): State<AppState>) -> impl IntoResponse {
    get_provider_models(State(state), Path("openrouter".to_string())).await
}
