use directories::ProjectDirs;
use std::path::{Path, PathBuf};
use tracing::info;

const APP_QUALIFIER: &str = "";
const APP_ORG: &str = "";
const APP_NAME: &str = "KathaGPT";

/// Old qualifier used before the path fix (produced com.KathaGPT.KathaGPT on macOS).
const LEGACY_QUALIFIER: &str = "com";
const LEGACY_ORG_OLD: &str = "KathGPT";
const LEGACY_ORG: &str = "KathaGPT";
const LEGACY_DB: &str = "kathgpt.db";
const CURRENT_DB: &str = "kathagpt.db";

/// OS-specific application data directory.
/// macOS: ~/Library/Application Support/KathaGPT/
/// Windows: %APPDATA%\KathaGPT\
/// Linux: ~/.local/share/KathaGPT/
pub fn app_data_dir() -> anyhow::Result<PathBuf> {
    let new_dir = project_data_dir(APP_QUALIFIER, APP_ORG, APP_NAME)?;
    migrate_legacy_app_data(&new_dir)?;
    Ok(new_dir)
}

pub fn database_path() -> anyhow::Result<PathBuf> {
    let dir = app_data_dir()?;
    let new_db = dir.join(CURRENT_DB);
    if new_db.exists() {
        return Ok(new_db);
    }

    let legacy_db = dir.join(LEGACY_DB);
    if legacy_db.exists() {
        std::fs::rename(&legacy_db, &new_db)?;
        info!("Renamed legacy database to {}", new_db.display());
        return Ok(new_db);
    }

    Ok(new_db)
}

/// Default Axum listen port for the embedded local API server.
pub const DEFAULT_API_PORT: u16 = 17890;

fn project_data_dir(qualifier: &str, org: &str, name: &str) -> anyhow::Result<PathBuf> {
    let dirs = ProjectDirs::from(qualifier, org, name)
        .ok_or_else(|| anyhow::anyhow!("Could not resolve application data directory"))?;
    Ok(dirs.data_dir().to_path_buf())
}

fn migrate_legacy_app_data(new_dir: &Path) -> anyhow::Result<()> {
    if new_dir.exists() {
        return Ok(());
    }

    // Try both legacy paths in order: com.KathaGPT.KathaGPT then com.KathGPT.KathGPT
    let legacy_candidates = [
        project_data_dir(LEGACY_QUALIFIER, LEGACY_ORG, LEGACY_ORG),
        project_data_dir(LEGACY_QUALIFIER, LEGACY_ORG_OLD, LEGACY_ORG_OLD),
    ];

    for candidate in legacy_candidates {
        let legacy_dir = match candidate {
            Ok(path) => path,
            Err(_) => continue,
        };

        if !legacy_dir.exists() {
            continue;
        }

        if let Some(parent) = new_dir.parent() {
            std::fs::create_dir_all(parent)?;
        }

        std::fs::rename(&legacy_dir, new_dir)?;
        info!(
            "Migrated app data from {} to {}",
            legacy_dir.display(),
            new_dir.display()
        );
        return Ok(());
    }

    Ok(())
}
