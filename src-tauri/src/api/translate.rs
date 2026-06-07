use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use serde::Deserialize;

use crate::llm::translate;
use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/translate", post(translate_text))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TranslateRequest {
    text: String,
    #[serde(default)]
    source_language: Option<String>,
    target_language: String,
}

async fn translate_text(
    State(state): State<AppState>,
    Json(body): Json<TranslateRequest>,
) -> impl IntoResponse {
    if body.text.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Text is required" })),
        )
            .into_response();
    }
    if body.target_language.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Target language is required" })),
        )
            .into_response();
    }

    match translate::translate_text(
        &state.db,
        &body.text,
        body.source_language.as_deref(),
        &body.target_language,
    )
    .await
    {
        Ok(translated) => (
            StatusCode::OK,
            Json(serde_json::json!({ "translatedText": translated })),
        )
            .into_response(),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}
