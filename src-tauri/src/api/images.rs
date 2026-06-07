use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;

use crate::llm::image_gen;
use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/images/models", get(list_models))
        .route("/images/generate", post(generate))
        .route("/images/improve-prompt", post(improve_prompt))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct GenerateImageRequest {
    model: String,
    prompt: String,
    #[serde(default)]
    style: Option<String>,
    #[serde(default)]
    aspect_ratio: Option<String>,
    #[serde(default = "default_count")]
    count: u32,
}

fn default_count() -> u32 {
    1
}

#[derive(Debug, Deserialize)]
struct ImprovePromptRequest {
    prompt: String,
}

async fn list_models(State(state): State<AppState>) -> impl IntoResponse {
    match image_gen::list_image_models(&state.db).await {
        Ok(models) => (StatusCode::OK, Json(models)).into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn generate(
    State(state): State<AppState>,
    Json(body): Json<GenerateImageRequest>,
) -> impl IntoResponse {
    if body.prompt.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Prompt is required" })),
        )
            .into_response();
    }
    if body.model.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Model is required" })),
        )
            .into_response();
    }

    match image_gen::generate_images(
        &state.db,
        &body.model,
        &body.prompt,
        body.style.as_deref(),
        body.aspect_ratio.as_deref(),
        body.count,
    )
    .await
    {
        Ok(images) => (StatusCode::OK, Json(images)).into_response(),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn improve_prompt(
    State(state): State<AppState>,
    Json(body): Json<ImprovePromptRequest>,
) -> impl IntoResponse {
    if body.prompt.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Prompt is required" })),
        )
            .into_response();
    }

    match image_gen::improve_prompt(&state.db, &body.prompt).await {
        Ok(improved) => (
            StatusCode::OK,
            Json(serde_json::json!({ "prompt": improved })),
        )
            .into_response(),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}
