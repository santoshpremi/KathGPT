/// Manages the bundled llama-server binary that powers local model inference.
///
/// The binary is NOT shipped inside the installer to keep it small.
/// On first use KathaGPT downloads the correct llama-server build (~15–20 MB)
/// from the llama.cpp GitHub Releases into the app-data directory.
/// Subsequent launches reuse the cached binary.
///
/// The server exposes an OpenAI-compatible REST API at 127.0.0.1:11435 so
/// stream.rs can reuse the same code path as every other cloud provider.
use std::path::PathBuf;
use std::sync::OnceLock;
use tokio::process::Child;
use tokio::sync::Mutex;
use tracing::info;

use crate::config;

pub const SIDECAR_PORT: u16 = 11435;
pub const SIDECAR_BASE_URL: &str = "http://127.0.0.1:11435";

struct SidecarState {
    child: Option<Child>,
    loaded_model: Option<String>,
}

fn state() -> &'static Mutex<SidecarState> {
    static S: OnceLock<Mutex<SidecarState>> = OnceLock::new();
    S.get_or_init(|| {
        Mutex::new(SidecarState {
            child: None,
            loaded_model: None,
        })
    })
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Path to the downloaded llama-server binary.
pub fn binary_path() -> anyhow::Result<PathBuf> {
    let dir = config::app_data_dir()?;
    let name = if cfg!(target_os = "windows") {
        "llama-server.exe"
    } else {
        "llama-server"
    };
    Ok(dir.join("bin").join(name))
}

/// Directory where .gguf model files are stored.
pub fn models_dir() -> anyhow::Result<PathBuf> {
    let dir = config::app_data_dir()?;
    Ok(dir.join("models"))
}

/// Path for a named model file.
pub fn model_path(filename: &str) -> anyhow::Result<PathBuf> {
    Ok(models_dir()?.join(filename))
}

/// Returns true if the llama-server binary and its shared libs are on disk.
/// The binary itself is a thin launcher (~33KB); the real check is whether
/// the shared libraries it depends on have been extracted alongside it.
pub fn binary_installed() -> bool {
    let Ok(bin) = binary_path() else { return false };
    if !bin.exists() {
        return false;
    }
    // Check that at least one shared lib was extracted next to the binary
    let Ok(bin_dir) = bin.parent().ok_or(()) else { return false };
    let Ok(entries) = std::fs::read_dir(bin_dir) else { return false };
    entries.flatten().any(|e| {
        let name = e.file_name();
        let n = name.to_string_lossy();
        n.ends_with(".dylib") || n.ends_with(".so") || n.contains(".so.")
    })
}

/// Fetch the download URL for the correct llama-server archive by querying
/// the GitHub Releases API at runtime — this way we never hardcode a stale tag.
async fn release_download_url() -> anyhow::Result<String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .user_agent("KathaGPT/1.0")
        .build()?;

    let api_url = "https://api.github.com/repos/ggml-org/llama.cpp/releases/latest";
    let resp = client.get(api_url).send().await?;
    if !resp.status().is_success() {
        anyhow::bail!("GitHub API error {}: {api_url}", resp.status());
    }

    let release: serde_json::Value = resp.json().await?;
    let assets = release["assets"]
        .as_array()
        .ok_or_else(|| anyhow::anyhow!("Unexpected GitHub API response"))?;

    let want = if cfg!(target_os = "macos") && cfg!(target_arch = "aarch64") {
        "bin-macos-arm64"
    } else if cfg!(target_os = "macos") {
        "bin-macos-x64"
    } else if cfg!(target_os = "linux") && cfg!(target_arch = "aarch64") {
        "bin-ubuntu-arm64"
    } else if cfg!(target_os = "linux") {
        "bin-ubuntu-x64"
    } else if cfg!(target_os = "windows") {
        "bin-win-cpu-x64"
    } else {
        anyhow::bail!("No llama-server binary available for this platform")
    };

    for asset in assets {
        let name = asset["name"].as_str().unwrap_or("");
        let url = asset["browser_download_url"].as_str().unwrap_or("");
        if name.contains(want) && !name.contains("vulkan") && !name.contains("cuda") && !name.contains("rocm") && !name.contains("openvino") {
            return Ok(url.to_string());
        }
    }

    anyhow::bail!("Could not find a llama-server binary for this platform in the latest release")
}

/// Download the llama-server binary, reporting progress via `on_progress(bytes_done, total_bytes)`.
pub async fn download_binary<F>(on_progress: F) -> anyhow::Result<()>
where
    F: Fn(u64, u64) + Send + 'static,
{
    let url = release_download_url().await?;

    let dest = binary_path()?;
    if let Some(parent) = dest.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::create_dir_all(models_dir()?)?;

    info!("Downloading llama-server from {url}");
    let archive_bytes = download_bytes_with_progress(&url, on_progress).await?;

    if url.ends_with(".tar.gz") || url.ends_with(".tgz") {
        extract_server_binary_tar(&archive_bytes, &dest)?;
    } else {
        extract_server_binary_zip(&archive_bytes, &dest)?;
    }

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        if let Some(bin_dir) = dest.parent() {
            if let Ok(entries) = std::fs::read_dir(bin_dir) {
                for entry in entries.flatten() {
                    if let Ok(mut perms) = entry.metadata().and_then(|m| Ok(m.permissions())) {
                        perms.set_mode(0o755);
                        let _ = std::fs::set_permissions(entry.path(), perms);
                    }
                }
            }
        }
    }

    // macOS: clear Gatekeeper quarantine flag so the binary can run without
    // prompting "cannot be opened because the developer cannot be verified".
    #[cfg(target_os = "macos")]
    {
        if let Some(bin_dir) = dest.parent() {
            let _ = std::process::Command::new("xattr")
                .arg("-rd")
                .arg("com.apple.quarantine")
                .arg(bin_dir)
                .output();
        }
    }

    info!("llama-server installed at {}", dest.display());
    Ok(())
}

/// Ensure the sidecar is running with the given model loaded.
/// If a different model is already loaded the server is restarted.
pub async fn ensure_running(model_name: &str) -> anyhow::Result<()> {
    let mut guard = state().lock().await;

    if let Some(ref loaded) = guard.loaded_model {
        if loaded == model_name && is_ready().await {
            return Ok(());
        }
    }

    if let Some(mut child) = guard.child.take() {
        let _ = child.kill().await;
    }

    let bin = binary_path()?;
    if !bin.exists() {
        anyhow::bail!("llama-server binary not found. Download it first via the Add Local Model screen.");
    }

    let filename = crate::llm::sidecar::gguf_filename(model_name);
    let model_file = model_path(&filename)?;
    if !model_file.exists() {
        anyhow::bail!("Model file not found: {}", model_file.display());
    }

    // The bin dir also contains the dylibs — tell the dynamic linker where to find them
    let bin_dir = bin.parent().unwrap_or_else(|| std::path::Path::new("."));

    // Context size — Llama 3.2 supports up to 128K, but we cap at a practical
    // value: 16K for larger models, 8K for small ones (fits in 4-8GB RAM with Metal).
    let ctx_size = if model_name.contains("1b") || model_name.contains("1B") {
        8192u32
    } else if model_name.contains("3b") || model_name.contains("3B") {
        16384
    } else {
        32768
    };

    info!("Starting llama-server: model={model_name} ctx={ctx_size} port={SIDECAR_PORT}");

    let mut cmd = tokio::process::Command::new(&bin);
    cmd.arg("--model")
        .arg(&model_file)
        .arg("--port")
        .arg(SIDECAR_PORT.to_string())
        .arg("--host")
        .arg("127.0.0.1")
        .arg("--ctx-size")
        .arg(ctx_size.to_string())
        .arg("--n-gpu-layers")
        .arg("99")       // Metal on Apple Silicon, CUDA on NVIDIA, CPU fallback everywhere else
        .arg("--parallel")
        .arg("1")
        .arg("--flash-attn")
        .arg("auto")     // "auto" is safe on all platforms; uses FA when hardware supports it
        // Tell the dynamic linker where to find the shared libs extracted next to the binary
        .env("DYLD_LIBRARY_PATH", bin_dir)   // macOS
        .env("LD_LIBRARY_PATH", bin_dir)     // Linux
        .kill_on_drop(true);

    let child = cmd.spawn()?;

    guard.child = Some(child);
    guard.loaded_model = Some(model_name.to_string());

    // Release lock while we wait so other callers don't deadlock
    drop(guard);

    for _ in 0..120 {
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        if is_ready().await {
            info!("llama-server ready");
            return Ok(());
        }
    }

    anyhow::bail!("llama-server did not become ready within 60 seconds")
}

/// Stop the running sidecar process.
pub async fn stop() {
    let mut guard = state().lock().await;
    if let Some(mut child) = guard.child.take() {
        let _ = child.kill().await;
    }
    guard.loaded_model = None;
}

/// Returns true if the sidecar health endpoint responds OK.
pub async fn is_ready() -> bool {
    let Ok(client) = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(2))
        .build()
    else {
        return false;
    };
    client
        .get(format!("{SIDECAR_BASE_URL}/health"))
        .send()
        .await
        .map(|r| r.status().is_success())
        .unwrap_or(false)
}

/// The model name currently loaded in the sidecar.
pub async fn current_model() -> Option<String> {
    state().lock().await.loaded_model.clone()
}

/// True if the .gguf file for this model is already on disk.
pub fn model_downloaded(model_name: &str) -> bool {
    model_path(&gguf_filename(model_name))
        .map(|p| p.exists())
        .unwrap_or(false)
}

/// List all downloaded model names derived from .gguf filenames.
pub fn list_downloaded_models() -> Vec<String> {
    let Ok(dir) = models_dir() else {
        return vec![];
    };
    let Ok(entries) = std::fs::read_dir(&dir) else {
        return vec![];
    };
    entries
        .filter_map(|e| e.ok())
        .filter_map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            if name.ends_with(".gguf") {
                Some(gguf_to_model_name(&name))
            } else {
                None
            }
        })
        .collect()
}

/// Delete a downloaded model file.
pub fn delete_model(model_name: &str) -> anyhow::Result<()> {
    let path = model_path(&gguf_filename(model_name))?;
    if path.exists() {
        std::fs::remove_file(&path)?;
    }
    Ok(())
}

/// Approximate file size of a downloaded .gguf in bytes (0 if not present).
pub fn model_file_size(model_name: &str) -> u64 {
    model_path(&gguf_filename(model_name))
        .ok()
        .and_then(|p| std::fs::metadata(p).ok())
        .map(|m| m.len())
        .unwrap_or(0)
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async fn download_bytes_with_progress<F>(url: &str, on_progress: F) -> anyhow::Result<Vec<u8>>
where
    F: Fn(u64, u64) + Send + 'static,
{
    use futures::StreamExt;

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(600))
        .build()?;

    let res = client.get(url).send().await?;
    if !res.status().is_success() {
        anyhow::bail!("HTTP {}: {url}", res.status());
    }

    let total = res.content_length().unwrap_or(0);
    let mut downloaded: u64 = 0;
    let mut body = Vec::new();
    let mut stream = res.bytes_stream();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        downloaded += chunk.len() as u64;
        body.extend_from_slice(&chunk);
        on_progress(downloaded, total);
    }

    Ok(body)
}

fn extract_server_binary_zip(zip_data: &[u8], dest: &std::path::Path) -> anyhow::Result<()> {
    use std::io::{Cursor, Read};

    let bin_dir = dest
        .parent()
        .ok_or_else(|| anyhow::anyhow!("Could not determine bin directory"))?;

    let cursor = Cursor::new(zip_data);
    let mut archive = zip::ZipArchive::new(cursor)?;

    let mut found_server = false;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i)?;
        let fname = file.name().to_string();
        if fname.contains("..") {
            continue;
        }

        let filename = std::path::Path::new(&fname)
            .file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_default();

        let should_extract = filename == "llama-server"
            || filename == "llama-server.exe"
            || filename.ends_with(".dylib")
            || filename.ends_with(".so")
            || filename.contains(".so.")
            || filename.ends_with(".dll");

        if should_extract {
            let out_path = bin_dir.join(&filename);
            let mut data = Vec::new();
            file.read_to_end(&mut data)?;
            std::fs::write(&out_path, data)?;

            if filename == "llama-server" || filename == "llama-server.exe" {
                found_server = true;
            }
        }
    }

    if found_server {
        Ok(())
    } else {
        anyhow::bail!("llama-server binary not found in zip archive")
    }
}

fn extract_server_binary_tar(tar_gz_data: &[u8], dest: &std::path::Path) -> anyhow::Result<()> {
    use flate2::read::GzDecoder;
    use std::io::Cursor;
    use tar::Archive;

    let bin_dir = dest
        .parent()
        .ok_or_else(|| anyhow::anyhow!("Could not determine bin directory"))?;

    let cursor = Cursor::new(tar_gz_data);
    let gz = GzDecoder::new(cursor);
    let mut archive = Archive::new(gz);

    let mut found_server = false;

    for entry in archive.entries()? {
        let mut entry = entry?;
        let path = entry.path()?.to_path_buf();

        // Guard against path traversal
        for component in path.components() {
            if matches!(component, std::path::Component::ParentDir) {
                continue;
            }
        }

        let filename = match path.file_name() {
            Some(n) => n.to_os_string(),
            None => continue,
        };

        let filename_str = filename.to_string_lossy();

        // Extract: the server binary, all dylibs/so files it needs
        let should_extract = filename_str == "llama-server"
            || filename_str == "llama-server.exe"
            || filename_str.ends_with(".dylib")
            || filename_str.ends_with(".so")
            || filename_str.ends_with(".dll");

        if should_extract {
            let out_path = bin_dir.join(&filename);
            entry.unpack(&out_path)?;

            if filename_str == "llama-server" || filename_str == "llama-server.exe" {
                found_server = true;
            }
        }
    }

    if found_server {
        Ok(())
    } else {
        anyhow::bail!("llama-server binary not found in tar.gz archive")
    }
}

/// Convert a model name (e.g. "llama3.2:3b") to a .gguf filename.
pub fn gguf_filename(model_name: &str) -> String {
    if let Some(entry) = crate::llm::model_catalog::CATALOG
        .iter()
        .find(|e| e.name == model_name)
    {
        return entry.gguf_filename.to_string();
    }
    // Fallback for unknown models
    format!("{}.gguf", model_name.replace([':', '/'], "-"))
}

fn gguf_to_model_name(filename: &str) -> String {
    if let Some(entry) = crate::llm::model_catalog::CATALOG
        .iter()
        .find(|e| e.gguf_filename == filename)
    {
        return entry.name.to_string();
    }
    filename.trim_end_matches(".gguf").to_string()
}
