use axum::{
    extract::Query,
    http::StatusCode,
    response::{IntoResponse, Sse},
    routing::{delete, get, post},
    Json, Router,
};
use futures::stream;
use serde::{Deserialize, Serialize};
use std::convert::Infallible;
use std::time::Duration;

use crate::hardware;
use crate::llm::{model_catalog, model_dl, sidecar};
use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/local-models/status", get(get_status))
        .route("/local-models/hardware", get(get_hardware))
        .route("/local-models/installed", get(get_installed))
        .route("/local-models/catalog", get(get_catalog))
        .route("/local-models/download", post(start_download))
        .route("/local-models/progress", get(get_progress))
        .route("/local-models/delete", delete(delete_model))
        // Keep old /pull endpoint as alias so existing clients don't break
        .route("/local-models/pull", post(start_download))
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SidecarStatus {
    pub ready: bool,
    pub binary_installed: bool,
    pub loaded_model: Option<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InstalledModel {
    pub name: String,
    pub display_name: String,
    pub size_bytes: u64,
    pub parameter_size: String,
    pub quantization: String,
    pub loaded: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CatalogModel {
    pub name: String,
    pub display_name: String,
    pub description: String,
    pub tags: Vec<String>,
    pub parameter_size: String,
    pub size_bytes: u64,
    pub min_ram_gb: u8,
    pub installed: bool,
    /// true if a download job is currently running for this model
    pub downloading: bool,
    /// Fits the detected machine RAM budget
    pub compatible: bool,
    /// Suggested starting model for this machine
    pub recommended: bool,
    pub quant: String,
}

// ---------------------------------------------------------------------------
// Request types
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
struct CatalogQuery {
    #[serde(default)]
    search: String,
}

#[derive(Debug, Deserialize)]
struct DownloadRequest {
    name: String,
}

#[derive(Debug, Deserialize)]
struct DeleteRequest {
    name: String,
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async fn get_status() -> impl IntoResponse {
    let loaded_model = sidecar::current_model().await;
    let ready = sidecar::is_ready().await;
    Json(SidecarStatus {
        ready,
        binary_installed: sidecar::binary_installed(),
        loaded_model,
    })
}

async fn get_hardware() -> impl IntoResponse {
    Json(hardware::detect())
}

async fn get_installed() -> impl IntoResponse {
    let downloaded = sidecar::list_downloaded_models();
    let loaded = sidecar::current_model().await;
    let models: Vec<InstalledModel> = downloaded
        .iter()
        .map(|name| {
            let entry = model_catalog::find(name);
            InstalledModel {
                name: name.clone(),
                display_name: entry
                    .map(|e| e.display_name.to_string())
                    .unwrap_or_else(|| name.clone()),
                size_bytes: sidecar::model_file_size(name),
                parameter_size: entry
                    .map(|e| e.parameter_size.to_string())
                    .unwrap_or_default(),
                quantization: entry.map(|e| e.quant.to_string()).unwrap_or_default(),
                loaded: loaded.as_deref() == Some(name.as_str()),
            }
        })
        .collect();
    (StatusCode::OK, Json(models))
}

async fn get_catalog(Query(query): Query<CatalogQuery>) -> impl IntoResponse {
    let downloaded = sidecar::list_downloaded_models();
    let in_progress: Vec<_> = model_dl::all_progress()
        .into_iter()
        .filter(|p| !p.done)
        .map(|p| p.model_name)
        .collect();

    let hw = hardware::detect();
    let recommended_name = hw.recommended_model.as_deref();

    let entries = model_catalog::search(&query.search);
    let models: Vec<CatalogModel> = entries
        .iter()
        .map(|e| CatalogModel {
            name: e.name.to_string(),
            display_name: e.display_name.to_string(),
            description: e.description.to_string(),
            tags: e.tags.iter().map(|t| t.to_string()).collect(),
            parameter_size: e.parameter_size.to_string(),
            size_bytes: e.size_bytes,
            min_ram_gb: e.min_ram_gb,
            installed: downloaded.contains(&e.name.to_string()),
            downloading: in_progress.contains(&e.name.to_string()),
            compatible: e.min_ram_gb <= hw.effective_ram_gb,
            recommended: recommended_name == Some(e.name),
            quant: e.quant.to_string(),
        })
        .collect();
    (StatusCode::OK, Json(models))
}

async fn start_download(Json(body): Json<DownloadRequest>) -> impl IntoResponse {
    let name = body.name.trim().to_string();
    if name.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Model name is required" })),
        )
            .into_response();
    }

    match model_dl::start_download(name) {
        Ok(()) => (StatusCode::OK, Json(serde_json::json!({ "ok": true }))).into_response(),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

/// SSE stream — client subscribes and receives progress events.
/// Each event is `data: <json>\n\n` where json matches `DownloadProgress`.
async fn get_progress() -> Sse<impl futures::Stream<Item = Result<axum::response::sse::Event, Infallible>>> {
    let s = stream::unfold((), |_| async {
        tokio::time::sleep(Duration::from_millis(400)).await;
        let all = model_dl::all_progress();
        let json = serde_json::to_string(&all).unwrap_or_else(|_| "[]".to_string());
        let event = axum::response::sse::Event::default().data(json);
        Some((Ok::<_, Infallible>(event), ()))
    });
    Sse::new(s).keep_alive(
        axum::response::sse::KeepAlive::new()
            .interval(Duration::from_secs(15))
            .text("ping"),
    )
}

async fn delete_model(Json(body): Json<DeleteRequest>) -> impl IntoResponse {
    let name = body.name.trim();
    if name.is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Model name is required" })),
        )
            .into_response();
    }

    match sidecar::delete_model(name).await {
        Ok(()) => (StatusCode::OK, Json(serde_json::json!({ "ok": true }))).into_response(),
        Err(err) => (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}
