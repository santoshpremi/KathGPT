use axum::{
    body::Body,
    extract::{Path, State},
    http::{header, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use base64::{engine::general_purpose::STANDARD as B64, Engine};
use serde::Deserialize;

use crate::file_preview;
use crate::llm::translate_file;
use crate::server::AppState;

const MAX_UPLOAD_BYTES: usize = 12 * 1024 * 1024;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/files/extract-text", post(extract_text))
        .route("/files/preview", post(create_preview))
        .route("/files/preview/{preview_id}", get(get_preview))
        .route("/files/translate", post(translate_file_handler))
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct ExtractTextRequest {
    filename: String,
    data: String,
}

async fn extract_text(
    State(_state): State<AppState>,
    Json(body): Json<ExtractTextRequest>,
) -> impl IntoResponse {
    let filename = body.filename.trim();
    if filename.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Filename is required" })),
        )
            .into_response();
    }

    let bytes = match B64.decode(body.data.trim()) {
        Ok(b) => b,
        Err(err) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": format!("Invalid file data: {err}") })),
            )
                .into_response();
        }
    };

    let text = match filename.to_lowercase().as_str() {
        name if name.ends_with(".pdf") => match pdf_extract::extract_text_from_mem(&bytes) {
            Ok(t) => t,
            Err(err) => {
                return (
                    StatusCode::BAD_REQUEST,
                    Json(serde_json::json!({ "error": format!("Could not read PDF: {err}") })),
                )
                    .into_response();
            }
        },
        name if name.ends_with(".txt") || name.ends_with(".md") || name.ends_with(".csv") => {
            match String::from_utf8(bytes) {
                Ok(t) => t,
                Err(_) => {
                    return (
                        StatusCode::BAD_REQUEST,
                        Json(serde_json::json!({ "error": "File is not valid UTF-8 text" })),
                    )
                        .into_response();
                }
            }
        }
        _ => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": "Unsupported file type" })),
            )
                .into_response();
        }
    };

    let trimmed = text.trim();
    if trimmed.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "No text found in file" })),
        )
            .into_response();
    }

    (
        StatusCode::OK,
        Json(serde_json::json!({ "text": trimmed })),
    )
        .into_response()
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct TranslateFileRequest {
    filename: String,
    data: String,
    #[serde(default)]
    source_language: Option<String>,
    target_language: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PreviewRequest {
    data: String,
    mime_type: String,
}

async fn create_preview(Json(body): Json<PreviewRequest>) -> impl IntoResponse {
    let bytes = match B64.decode(body.data.trim()) {
        Ok(b) => b,
        Err(err) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": format!("Invalid file data: {err}") })),
            )
                .into_response();
        }
    };

    if bytes.len() > MAX_UPLOAD_BYTES {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "File is too large (max 12 MB)" })),
        )
            .into_response();
    }

    let mime = if body.mime_type.trim().is_empty() {
        "application/octet-stream".to_string()
    } else {
        body.mime_type.trim().to_string()
    };

    let preview_id = file_preview::store(bytes, mime);
    (
        StatusCode::OK,
        Json(serde_json::json!({ "previewId": preview_id })),
    )
        .into_response()
}

async fn get_preview(Path(preview_id): Path<String>) -> impl IntoResponse {
    match file_preview::get(&preview_id) {
        Some((bytes, mime)) => Response::builder()
            .status(StatusCode::OK)
            .header(header::CONTENT_TYPE, mime)
            .header(header::CACHE_CONTROL, "no-store")
            .body(Body::from(bytes))
            .unwrap()
            .into_response(),
        None => (
            StatusCode::NOT_FOUND,
            Json(serde_json::json!({ "error": "Preview not found or expired" })),
        )
            .into_response(),
    }
}

async fn translate_file_handler(
    State(state): State<AppState>,
    Json(body): Json<TranslateFileRequest>,
) -> impl IntoResponse {
    let filename = body.filename.trim();
    if filename.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Filename is required" })),
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

    let bytes = match B64.decode(body.data.trim()) {
        Ok(b) => b,
        Err(err) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(serde_json::json!({ "error": format!("Invalid file data: {err}") })),
            )
                .into_response();
        }
    };

    if bytes.len() > MAX_UPLOAD_BYTES {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "File is too large (max 12 MB)" })),
        )
            .into_response();
    }

    match translate_file::translate_file(
        &state.db,
        filename,
        &bytes,
        body.source_language.as_deref(),
        &body.target_language,
    )
    .await
    {
        Ok(result) => {
            let encoded = B64.encode(&result.bytes);
            let preview_id = file_preview::store(result.bytes.clone(), result.mime_type.clone());
            (
                StatusCode::OK,
                Json(serde_json::json!({
                    "filename": result.filename,
                    "mimeType": result.mime_type,
                    "data": encoded,
                    "previewId": preview_id,
                })),
            )
                .into_response()
        }
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}
