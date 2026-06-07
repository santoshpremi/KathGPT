mod import;
pub mod repos;

use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::str::FromStr;
use tracing::info;

use crate::config;
use repos::{user_profile, workflows};

pub async fn init_pool() -> anyhow::Result<SqlitePool> {
    let data_dir = config::app_data_dir()?;
    std::fs::create_dir_all(&data_dir)?;

    let db_path = config::database_path()?;
    info!("Database path: {}", db_path.display());

    let options = SqliteConnectOptions::from_str(&format!("sqlite:{}", db_path.display()))?
        .create_if_missing(true)
        .foreign_keys(true);

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(options)
        .await?;

    run_migrations(&pool).await?;
    user_profile::ensure_seed(&pool).await?;
    workflows::ensure_seed(&pool).await?;
    import::import_legacy_if_needed(&pool).await?;
    Ok(pool)
}

async fn run_migrations(pool: &SqlitePool) -> anyhow::Result<()> {
    apply_migration_file(pool, 1, include_str!("../../../migrations/001_initial.sql")).await?;
    apply_migration_file(pool, 2, include_str!("../../../migrations/002_documents.sql")).await?;
    info!("SQLite migrations applied");
    Ok(())
}

async fn apply_migration_file(pool: &SqlitePool, version: i64, sql_file: &str) -> anyhow::Result<()> {
    // Treat "no such table: schema_migrations" as "not yet applied" — happens on a fresh DB
    // where migration 1 hasn't run yet and the table doesn't exist.
    let applied: Option<i64> =
        sqlx::query_scalar("SELECT version FROM schema_migrations WHERE version = ?")
            .bind(version)
            .fetch_optional(pool)
            .await
            .ok()
            .flatten();

    if applied.is_some() {
        return Ok(());
    }

    for statement in sql_file.split(';') {
        let sql = statement.trim();
        if sql.is_empty() || sql.starts_with("--") {
            continue;
        }
        sqlx::query(sql).execute(pool).await?;
    }

    sqlx::query(
        "INSERT INTO schema_migrations (version, applied_at) VALUES (?, datetime('now'))",
    )
    .bind(version)
    .execute(pool)
    .await?;

    Ok(())
}
