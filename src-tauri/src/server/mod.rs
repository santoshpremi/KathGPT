use axum::{
    extract::State,
    http::{header, StatusCode},
    response::{IntoResponse, Json},
    routing::get,
    Router,
};
use serde::Serialize;
use sqlx::SqlitePool;
use std::net::SocketAddr;
use std::path::PathBuf;
use tower_http::cors::{Any, CorsLayer};
use tower_http::services::{ServeDir, ServeFile};
use tracing::info;

use crate::api;
use crate::config::DEFAULT_API_PORT;

#[derive(Clone)]
pub struct AppState {
    pub db: SqlitePool,
    pub dist_dir: Option<PathBuf>,
}

#[derive(Serialize)]
struct HealthResponse {
    status: &'static str,
    version: &'static str,
    engine: &'static str,
    database: &'static str,
}

#[derive(Serialize)]
struct StatusResponse {
    product: &'static str,
    edition: &'static str,
    api_port: u16,
    ready: bool,
}

const PORT_SCAN_RANGE: u16 = 10;

pub async fn start(state: AppState) -> anyhow::Result<u16> {
    let app = build_router(state);

    for offset in 0..PORT_SCAN_RANGE {
        let port = DEFAULT_API_PORT.saturating_add(offset);
        let addr = SocketAddr::from(([127, 0, 0, 1], port));
        let listener = match tokio::net::TcpListener::bind(addr).await {
            Ok(listener) => listener,
            Err(err) if err.kind() == std::io::ErrorKind::AddrInUse => {
                tracing::warn!("Port {port} in use, trying next");
                continue;
            }
            Err(err) => return Err(err.into()),
        };

        let bound_port = listener.local_addr()?.port();
        info!("KathGPT local API listening on http://127.0.0.1:{bound_port}");

        tokio::spawn(async move {
            if let Err(err) = axum::serve(listener, app).await {
                tracing::error!("API server error: {err}");
            }
        });

        return Ok(bound_port);
    }

    anyhow::bail!(
        "No free port in range {}-{}",
        DEFAULT_API_PORT,
        DEFAULT_API_PORT + PORT_SCAN_RANGE - 1
    )
}

pub fn build_router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let local_api = Router::new()
        .route("/health", get(health))
        .route("/v1/status", get(status))
        .merge(api::routes())
        .with_state(state.clone());

    let mut router = Router::new().nest("/api/local", local_api).layer(cors);

    if let Some(dist) = state.dist_dir.clone() {
        if dist.join("index.html").exists() {
            info!("Serving frontend from {}", dist.display());
            let index = dist.join("index.html");
            let serve_dir = ServeDir::new(dist).not_found_service(ServeFile::new(index));
            router = router.fallback_service(serve_dir);
        }
    }

    router
}

async fn health(State(state): State<AppState>) -> impl IntoResponse {
    let db_ok = sqlx::query("SELECT 1")
        .execute(&state.db)
        .await
        .is_ok();

    let status = if db_ok {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    (
        status,
        Json(HealthResponse {
            status: if db_ok { "ok" } else { "degraded" },
            version: env!("CARGO_PKG_VERSION"),
            engine: "rust-axum",
            database: if db_ok { "sqlite" } else { "unavailable" },
        }),
    )
}

async fn status() -> impl IntoResponse {
    (
        StatusCode::OK,
        [(header::CONTENT_TYPE, "application/json")],
        Json(StatusResponse {
            product: "KathGPT",
            edition: "local",
            api_port: DEFAULT_API_PORT,
            ready: true,
        }),
    )
}
