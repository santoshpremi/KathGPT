use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;

use crate::db::repos::artifacts as repo;
use crate::models::{Artifact, ArtifactVersion};
use crate::server::AppState;

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ArtifactDetail {
    #[serde(rename = "type")]
    artifact_type: String,
    id: String,
    title: String,
    versions: Vec<ArtifactVersionResponse>,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ArtifactVersionResponse {
    id: String,
    content: String,
    created_at: String,
    from_chat: bool,
    version: i32,
}

#[derive(Debug, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct ArtifactVersionPreview {
    title: String,
    content: String,
    artifact_id: String,
}

fn to_version_response(v: ArtifactVersion) -> ArtifactVersionResponse {
    ArtifactVersionResponse {
        id: v.id,
        content: v.content,
        created_at: v.created_at,
        from_chat: v.from_chat,
        version: v.version,
    }
}

async fn artifact_detail(
    state: &AppState,
    artifact: Artifact,
) -> Result<ArtifactDetail, String> {
    let versions = repo::list_versions(&state.db, &artifact.id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(ArtifactDetail {
        artifact_type: "document".to_string(),
        id: artifact.id,
        title: artifact.title,
        versions: versions.into_iter().map(to_version_response).collect(),
    })
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateVersionRequest {
    content: String,
    #[serde(default)]
    from_chat: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateArtifactRequest {
    chat_id: String,
    title: String,
}

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/chats/{chat_id}/artifact", get(get_chat_artifact))
        .route("/artifact-versions/{version_id}", get(get_version_preview))
        .route("/artifacts/{artifact_id}", get(get_artifact))
        .route(
            "/artifacts/{artifact_id}/versions/{version_id}",
            get(get_version),
        )
        .route(
            "/artifacts/{artifact_id}/versions",
            post(create_version),
        )
        .route("/artifacts", post(create_artifact))
}

async fn get_chat_artifact(
    State(state): State<AppState>,
    Path(chat_id): Path<String>,
) -> impl IntoResponse {
    match repo::get_by_chat_id(&state.db, &chat_id).await {
        Ok(Some(artifact)) => match artifact_detail(&state, artifact).await {
            Ok(detail) => (StatusCode::OK, Json(detail)).into_response(),
            Err(err) => error_response(err),
        },
        Ok(None) => StatusCode::NO_CONTENT.into_response(),
        Err(err) => error_response(err),
    }
}

async fn get_version_preview(
    State(state): State<AppState>,
    Path(version_id): Path<String>,
) -> impl IntoResponse {
    match repo::get_version_by_id(&state.db, &version_id).await {
        Ok(Some((version, title))) => (
            StatusCode::OK,
            Json(ArtifactVersionPreview {
                title,
                content: version.content,
                artifact_id: version.artifact_id,
            }),
        )
            .into_response(),
        Ok(None) => not_found(),
        Err(err) => error_response(err),
    }
}

async fn get_artifact(
    State(state): State<AppState>,
    Path(artifact_id): Path<String>,
) -> impl IntoResponse {
    match repo::get(&state.db, &artifact_id).await {
        Ok(Some(artifact)) => match artifact_detail(&state, artifact).await {
            Ok(detail) => (StatusCode::OK, Json(detail)).into_response(),
            Err(err) => error_response(err),
        },
        Ok(None) => not_found(),
        Err(err) => error_response(err),
    }
}

async fn get_version(
    State(state): State<AppState>,
    Path((artifact_id, version_id)): Path<(String, String)>,
) -> impl IntoResponse {
    match repo::get_version(&state.db, &artifact_id, &version_id).await {
        Ok(Some(version)) => (StatusCode::OK, Json(version)).into_response(),
        Ok(None) => not_found(),
        Err(err) => error_response(err),
    }
}

async fn create_version(
    State(state): State<AppState>,
    Path(artifact_id): Path<String>,
    Json(body): Json<CreateVersionRequest>,
) -> impl IntoResponse {
    match repo::create_version(&state.db, &artifact_id, &body.content, body.from_chat).await {
        Ok(version) => (StatusCode::CREATED, Json(version)).into_response(),
        Err(err) => error_response(err),
    }
}

async fn create_artifact(
    State(state): State<AppState>,
    Json(body): Json<CreateArtifactRequest>,
) -> impl IntoResponse {
    match repo::create_for_chat(&state.db, &body.chat_id, &body.title).await {
        Ok(artifact) => (StatusCode::CREATED, Json(artifact)).into_response(),
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
