use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use serde::Deserialize;
use uuid::Uuid;

use crate::config;
use crate::db::repos::documents as doc_repo;
use crate::document_text;
use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/documents/upload", post(upload_document))
        .route("/documents/{document_id}/header", get(get_document_header))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UploadDocumentRequest {
    filename: String,
    data: String,
    #[serde(default)]
    mime_type: Option<String>,
    #[serde(default)]
    size: Option<u64>,
}

async fn upload_document(
    State(state): State<AppState>,
    Json(body): Json<UploadDocumentRequest>,
) -> impl IntoResponse {
    let filename = body.filename.trim();
    if filename.is_empty() {
        return bad_request("Filename is required");
    }

    let bytes = match B64.decode(body.data.trim()) {
        Ok(b) => b,
        Err(err) => return bad_request(&format!("Invalid file data: {err}")),
    };

    if bytes.is_empty() {
        return bad_request("File is empty");
    }

    if bytes.len() > 524_288_000 {
        return bad_request("File exceeds 500 MB limit");
    }

    let text = match document_text::extract_text(filename, &bytes) {
        Ok(t) => t,
        Err(msg) => return bad_request(&msg),
    };

    let content_length = text.len() as i64;
    if content_length == 0 {
        return bad_request("No readable content found in file");
    }

    let id = format!("doc_{}", Uuid::new_v4());
    let now = chrono::Utc::now().to_rfc3339();
    let file_type = body
        .mime_type
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| guess_mime(filename).to_string());

    let docs_dir = match documents_dir() {
        Ok(d) => d,
        Err(err) => return server_error(&err.to_string()),
    };

    let storage_path = docs_dir.join(&id);
    if let Err(err) = std::fs::write(&storage_path, &bytes) {
        return server_error(&format!("Could not save file: {err}"));
    }

    let record = doc_repo::DocumentRecord {
        id: id.clone(),
        file_name: filename.to_string(),
        file_type,
        original_size: body.size.unwrap_or(bytes.len() as u64) as i64,
        content_length,
        tokens: (content_length / 4).max(1),
        uploaded_by_id: "local-user".to_string(),
        created_at: now,
    };

    if let Err(err) = doc_repo::insert(
        &state.db,
        &record,
        &storage_path.to_string_lossy(),
    )
    .await
    {
        let _ = std::fs::remove_file(storage_path);
        return server_error(&err.to_string());
    }

    (StatusCode::CREATED, Json(record)).into_response()
}

async fn get_document_header(
    State(state): State<AppState>,
    Path(document_id): Path<String>,
) -> impl IntoResponse {
    match doc_repo::get(&state.db, &document_id).await {
        Ok(Some(doc)) => (StatusCode::OK, Json(doc)).into_response(),
        Ok(None) => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Document not found" })),
        )
            .into_response(),
        Err(err) => server_error(&err.to_string()),
    }
}

fn documents_dir() -> anyhow::Result<std::path::PathBuf> {
    let dir = config::app_data_dir()?.join("documents");
    std::fs::create_dir_all(&dir)?;
    Ok(dir)
}

fn guess_mime(filename: &str) -> &'static str {
    let lower = filename.to_lowercase();
    if lower.ends_with(".pdf") {
        "application/pdf"
    } else if lower.ends_with(".md") {
        "text/markdown"
    } else if lower.ends_with(".csv") {
        "text/csv"
    } else if lower.ends_with(".json") {
        "application/json"
    } else {
        "text/plain"
    }
}

fn bad_request(message: &str) -> axum::response::Response {
    (
        StatusCode::BAD_REQUEST,
        Json(serde_json::json!({ "error": message })),
    )
        .into_response()
}

fn server_error(message: &str) -> axum::response::Response {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(serde_json::json!({ "error": message })),
    )
        .into_response()
}
