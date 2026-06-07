use axum::{
    extract::State,
    http::StatusCode,
    response::IntoResponse,
    routing::{get, patch},
    Json, Router,
};

use crate::db::repos::user_profile;
use crate::models::UpdateUserRequest;
use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    Router::new().route("/user/me", get(get_me).patch(update_me))
}

async fn get_me(State(state): State<AppState>) -> impl IntoResponse {
    match user_profile::get_me(&state.db).await {
        Ok(user) => (StatusCode::OK, Json(user)).into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn update_me(
    State(state): State<AppState>,
    Json(body): Json<UpdateUserRequest>,
) -> impl IntoResponse {
    match user_profile::update_me(
        &state.db,
        body.first_name.as_deref(),
        body.last_name.as_deref(),
        body.locale.as_deref(),
        body.default_model.as_deref(),
        body.accepted_guidelines,
    )
    .await
    {
        Ok(user) => (StatusCode::OK, Json(user)).into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}
