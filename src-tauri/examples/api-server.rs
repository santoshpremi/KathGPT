//! Standalone Rust API server (no Tauri window) — useful for backend development.
//!
//! Run: `cargo run --example api-server` from `src-tauri/`

use tracing::info;
use tracing_subscriber::EnvFilter;
use kathgpt_local_lib::{config, db, server};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::from_default_env()
                .add_directive("kathgpt_local=info".parse().unwrap())
                .add_directive("api_server=info".parse().unwrap()),
        )
        .init();

    info!("Starting KathGPT API server (standalone mode)");
    info!("Data dir: {}", config::app_data_dir()?.display());

    let pool = db::init_pool().await?;
    let dist = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../dist");
    let dist_dir = dist.join("index.html").exists().then_some(dist);

    let state = server::AppState {
        db: pool,
        dist_dir,
    };

    let port = server::start(state).await?;
    info!("Health check: http://127.0.0.1:{port}/api/local/health");
    info!("Press Ctrl+C to stop");

    tokio::signal::ctrl_c().await?;
    Ok(())
}
