use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
    routing::get,
    Json, Router,
};
use serde::Deserialize;

use crate::db::repos::chats as repo;
use crate::models::{CreateChatRequest, UpdateChatRequest};
use crate::server::AppState;

#[derive(Debug, Deserialize)]
struct ListQuery {
    #[serde(default = "default_limit")]
    limit: i64,
}

fn default_limit() -> i64 {
    50
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/chats", get(list_chats).post(create_chat))
        .route(
            "/chats/{chat_id}",
            get(get_chat).patch(update_chat).delete(delete_chat),
        )
}

async fn list_chats(
    State(state): State<AppState>,
    Query(query): Query<ListQuery>,
) -> impl IntoResponse {
    match repo::list(&state.db, query.limit.min(100)).await {
        Ok(chats) => (StatusCode::OK, Json(chats)).into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn get_chat(
    State(state): State<AppState>,
    Path(chat_id): Path<String>,
) -> impl IntoResponse {
    match repo::get(&state.db, &chat_id).await {
        Ok(Some(chat)) => (StatusCode::OK, Json(chat)).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Chat not found" })),
        )
            .into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn create_chat(
    State(state): State<AppState>,
    Json(body): Json<CreateChatRequest>,
) -> impl IntoResponse {
    if body.id.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Chat id required" })),
        )
            .into_response();
    }

    match repo::create(
        &state.db,
        &body.id,
        body.name.as_deref(),
        body.model_override.as_deref(),
    )
    .await
    {
        Ok(chat) => (StatusCode::CREATED, Json(chat)).into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn update_chat(
    State(state): State<AppState>,
    Path(chat_id): Path<String>,
    Json(body): Json<UpdateChatRequest>,
) -> impl IntoResponse {
    if repo::get(&state.db, &chat_id).await.ok().flatten().is_none() {
        return (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Chat not found" })),
        )
            .into_response();
    }

    if let Some(name) = body.name.as_deref() {
        if let Err(err) = repo::set_name(&state.db, &chat_id, name).await {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": err.to_string() })),
            )
                .into_response();
        }
    }

    if body.set_model_override {
        let model = body.model_override.as_deref();
        if let Err(err) = repo::set_model_override(&state.db, &chat_id, model).await {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": err.to_string() })),
            )
                .into_response();
        }
    }

    match repo::get(&state.db, &chat_id).await {
        Ok(Some(chat)) => (StatusCode::OK, Json(chat)).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Chat not found" })),
        )
            .into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn delete_chat(
    State(state): State<AppState>,
    Path(chat_id): Path<String>,
) -> impl IntoResponse {
    match repo::delete(&state.db, &chat_id).await {
        Ok(true) => (StatusCode::OK, Json(serde_json::json!({ "success": true }))).into_response(),
        Ok(false) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Chat not found" })),
        )
            .into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}
