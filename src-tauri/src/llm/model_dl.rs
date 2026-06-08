/// Downloads .gguf model files from HuggingFace with per-job progress tracking.
///
/// Progress is stored in a global DashMap so the frontend can poll via SSE.
use dashmap::DashMap;
use serde::Serialize;
use std::sync::OnceLock;
use tracing::{info, warn};

use crate::llm::model_catalog;
use crate::llm::sidecar;

// ---------------------------------------------------------------------------
// Progress tracking
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadProgress {
    pub model_name: String,
    pub phase: Phase,
    pub bytes_done: u64,
    pub bytes_total: u64,
    /// 0.0 – 1.0; computed from bytes or fixed for indeterminate phases
    pub fraction: f64,
    pub done: bool,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Serialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum Phase {
    /// Downloading the llama-server binary
    DownloadingRuntime,
    /// Downloading the .gguf model file
    DownloadingModel,
    /// Extracting the binary from the archive
    Extracting,
    /// All done
    Complete,
}

static PROGRESS: OnceLock<DashMap<String, DownloadProgress>> = OnceLock::new();

fn progress_map() -> &'static DashMap<String, DownloadProgress> {
    PROGRESS.get_or_init(DashMap::new)
}

pub fn get_progress(model_name: &str) -> Option<DownloadProgress> {
    progress_map().get(model_name).map(|r| r.clone())
}

pub fn all_progress() -> Vec<DownloadProgress> {
    progress_map().iter().map(|r| r.clone()).collect()
}

fn set_progress(p: DownloadProgress) {
    progress_map().insert(p.model_name.clone(), p);
}

// ---------------------------------------------------------------------------
// Download entry point
// ---------------------------------------------------------------------------

/// Download a model by name, reporting progress via the global map.
/// This is intentionally fire-and-forget — call `get_progress` to poll.
pub fn start_download(model_name: String) -> anyhow::Result<()> {
    let entry = model_catalog::find(&model_name)
        .ok_or_else(|| anyhow::anyhow!("Unknown model: {model_name}"))?;

    let model_name_clone = model_name.clone();
    let download_url = entry.download_url;
    let gguf_filename = entry.gguf_filename;
    let size_bytes = entry.size_bytes;

    // Spawn as a background task
    tokio::spawn(async move {
        let result =
            run_download(model_name_clone.clone(), download_url, gguf_filename, size_bytes).await;
        if let Err(err) = result {
            warn!("Model download failed for {model_name_clone}: {err}");
            set_progress(DownloadProgress {
                model_name: model_name_clone,
                phase: Phase::Complete,
                bytes_done: 0,
                bytes_total: 0,
                fraction: 0.0,
                done: true,
                error: Some(err.to_string()),
            });
        }
    });

    Ok(())
}

async fn run_download(
    model_name: String,
    gguf_url: &str,
    gguf_filename: &str,
    size_hint: u64,
) -> anyhow::Result<()> {
    // Step 1: Download llama-server binary if not already installed
    if !sidecar::binary_installed() {
        info!("llama-server not installed, downloading…");
        let mn = model_name.clone();
        sidecar::download_binary(move |done, total| {
            set_progress(DownloadProgress {
                model_name: mn.clone(),
                phase: Phase::DownloadingRuntime,
                bytes_done: done,
                bytes_total: total,
                fraction: if total > 0 {
                    done as f64 / total as f64
                } else {
                    0.0
                },
                done: false,
                error: None,
            });
        })
        .await?;
    }

    // Step 2: Download the .gguf model file
    let dest = sidecar::model_path(gguf_filename)?;
    if dest.exists() {
        info!("Model already downloaded: {}", dest.display());
    } else {
        info!("Downloading model from {gguf_url}");
        let mn = model_name.clone();
        download_file(gguf_url, &dest, move |done, total| {
            let total = if total > 0 { total } else { size_hint };
            set_progress(DownloadProgress {
                model_name: mn.clone(),
                phase: Phase::DownloadingModel,
                bytes_done: done,
                bytes_total: total,
                fraction: if total > 0 {
                    done as f64 / total as f64
                } else {
                    0.0
                },
                done: false,
                error: None,
            });
        })
        .await?;
    }

    // Done
    set_progress(DownloadProgress {
        model_name: model_name.clone(),
        phase: Phase::Complete,
        bytes_done: size_hint,
        bytes_total: size_hint,
        fraction: 1.0,
        done: true,
        error: None,
    });

    info!("Model '{model_name}' ready.");
    Ok(())
}

async fn download_file<F>(url: &str, dest: &std::path::Path, on_progress: F) -> anyhow::Result<()>
where
    F: Fn(u64, u64) + Send + 'static,
{
    use futures::StreamExt;

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(3600))
        .build()?;

    let res = client.get(url).send().await?;
    if !res.status().is_success() {
        anyhow::bail!("HTTP {} downloading {url}", res.status());
    }

    let total = res.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut stream = res.bytes_stream();

    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }

    // Write to a temp file first so we never leave a partial .gguf
    let tmp = dest.with_extension("gguf.tmp");
    {
        use tokio::io::AsyncWriteExt;
        let mut file = tokio::fs::File::create(&tmp).await?;
        while let Some(chunk) = stream.next().await {
            let chunk = chunk?;
            downloaded += chunk.len() as u64;
            file.write_all(&chunk).await?;
            on_progress(downloaded, total);
        }
        file.flush().await?;
    }

    tokio::fs::rename(&tmp, dest).await?;
    Ok(())
}
