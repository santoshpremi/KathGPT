use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};

use crate::db::repos::workflows as repo;
use crate::models::{CreateWorkflowRequest, UpdateWorkflowRequest};
use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/workflows", get(list_workflows).post(create_workflow))
        .route(
            "/workflows/{workflow_id}",
            get(get_workflow).patch(update_workflow).delete(delete_workflow),
        )
        .route("/workflows/favorites", get(list_favorites))
        .route("/workflows/{workflow_id}/favorite", post(toggle_favorite))
}

async fn list_workflows(State(state): State<AppState>) -> impl IntoResponse {
    match repo::list_all(&state.db).await {
        Ok(workflows) => (StatusCode::OK, Json(workflows)).into_response(),
        Err(err) => error_response(err),
    }
}

async fn get_workflow(
    State(state): State<AppState>,
    Path(workflow_id): Path<String>,
) -> impl IntoResponse {
    match repo::get(&state.db, &workflow_id).await {
        Ok(Some(workflow)) => (StatusCode::OK, Json(workflow)).into_response(),
        Ok(None) => not_found(),
        Err(err) => error_response(err),
    }
}

async fn create_workflow(
    State(state): State<AppState>,
    Json(body): Json<CreateWorkflowRequest>,
) -> impl IntoResponse {
    if body.id.trim().is_empty() || body.name.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Workflow id and name required" })),
        )
            .into_response();
    }

    match repo::create(&state.db, &body).await {
        Ok(workflow) => (StatusCode::CREATED, Json(workflow)).into_response(),
        Err(err) => error_response(err),
    }
}

async fn update_workflow(
    State(state): State<AppState>,
    Path(workflow_id): Path<String>,
    Json(body): Json<UpdateWorkflowRequest>,
) -> impl IntoResponse {
    match repo::update(&state.db, &workflow_id, &body).await {
        Ok(Some(workflow)) => (StatusCode::OK, Json(workflow)).into_response(),
        Ok(None) => not_found(),
        Err(err) => error_response(err),
    }
}

async fn delete_workflow(
    State(state): State<AppState>,
    Path(workflow_id): Path<String>,
) -> impl IntoResponse {
    match repo::delete(&state.db, &workflow_id).await {
        Ok(true) => (StatusCode::OK, Json(serde_json::json!({ "success": true }))).into_response(),
        Ok(false) => not_found(),
        Err(err) => error_response(err),
    }
}

async fn list_favorites(State(state): State<AppState>) -> impl IntoResponse {
    match repo::list_favorites(&state.db).await {
        Ok(ids) => match repo::list_all(&state.db).await {
            Ok(all) => {
                let favorites: Vec<_> = all.into_iter().filter(|w| ids.contains(&w.id)).collect();
                (StatusCode::OK, Json(favorites)).into_response()
            }
            Err(err) => error_response(err),
        },
        Err(err) => error_response(err),
    }
}

async fn toggle_favorite(
    State(state): State<AppState>,
    Path(workflow_id): Path<String>,
) -> impl IntoResponse {
    match repo::toggle_favorite(&state.db, &workflow_id).await {
        Ok(favorited) => (
            StatusCode::OK,
            Json(serde_json::json!({ "favorited": favorited })),
        )
            .into_response(),
        Err(err) => error_response(err),
    }
}

fn not_found() -> axum::response::Response {
    (
        StatusCode::NOT_FOUND,
        Json(serde_json::json!({ "error": "Not found" })),
    )
        .into_response()
}

fn error_response(err: impl std::fmt::Display) -> axum::response::Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(serde_json::json!({ "error": err.to_string() })),
    )
        .into_response()
}
