use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use serde::Deserialize;

use crate::llm::models::ChatMessage;
use crate::llm::research;
use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/research/query", post(research_query))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResearchMessageInput {
    role: String,
    content: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ResearchRequest {
    model: String,
    messages: Vec<ResearchMessageInput>,
}

async fn research_query(
    State(state): State<AppState>,
    Json(body): Json<ResearchRequest>,
) -> impl IntoResponse {
    if body.messages.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "At least one message is required" })),
        )
            .into_response();
    }

    let messages: Vec<ChatMessage> = body
        .messages
        .into_iter()
        .map(|m| ChatMessage {
            role: m.role,
            content: m.content,
        })
        .collect();

    let has_user_content = messages
        .iter()
        .any(|m| m.role == "user" && !m.content.trim().is_empty());
    if !has_user_content {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "A non-empty user message is required" })),
        )
            .into_response();
    }

    match research::run_research(&state.db, &body.model, messages).await {
        Ok(result) => (StatusCode::OK, Json(result)).into_response(),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}
