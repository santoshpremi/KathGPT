use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde_json::Value;

use crate::db::repos::data_export;
use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/data/export", get(export_data))
        .route("/data/import", post(import_data))
}

async fn export_data(State(state): State<AppState>) -> impl IntoResponse {
    match data_export::export_snapshot(&state.db).await {
        Ok(data) => (StatusCode::OK, Json(data)).into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn import_data(
    State(state): State<AppState>,
    Json(body): Json<Value>,
) -> impl IntoResponse {
    match data_export::import_snapshot(&state.db, &body).await {
        Ok(counts) => (StatusCode::OK, Json(counts)).into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}
