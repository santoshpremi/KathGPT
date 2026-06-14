use sqlx::SqlitePool;

use crate::models::ChatSummary;

pub async fn delete_empty(pool: &SqlitePool) -> anyhow::Result<u64> {
    let result = sqlx::query(
        "DELETE FROM chats
         WHERE hidden = 0
           AND NOT EXISTS (SELECT 1 FROM messages WHERE messages.chat_id = chats.id)",
    )
    .execute(pool)
    .await?;
    Ok(result.rows_affected())
}

pub async fn list(pool: &SqlitePool, limit: i64) -> anyhow::Result<Vec<ChatSummary>> {
    let rows: Vec<(String, Option<String>, Option<String>, String, String)> = sqlx::query_as(
        "SELECT c.id, c.name, c.model_override, c.created_at, c.updated_at
         FROM chats c
         WHERE c.hidden = 0
           AND EXISTS (SELECT 1 FROM messages m WHERE m.chat_id = c.id)
         ORDER BY c.updated_at DESC
         LIMIT ?",
    )
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(rows
        .into_iter()
        .map(|r| ChatSummary {
            id: r.0,
            name: r.1,
            model_override: r.2,
            created_at: r.3,
            updated_at: r.4,
        })
        .collect())
}

pub async fn get(pool: &SqlitePool, chat_id: &str) -> anyhow::Result<Option<ChatSummary>> {
    let row: Option<(String, Option<String>, Option<String>, String, String)> = sqlx::query_as(
        "SELECT id, name, model_override, created_at, updated_at FROM chats WHERE id = ?",
    )
    .bind(chat_id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(|r| ChatSummary {
        id: r.0,
        name: r.1,
        model_override: r.2,
        created_at: r.3,
        updated_at: r.4,
    }))
}

pub async fn create(
    pool: &SqlitePool,
    id: &str,
    name: Option<&str>,
    model_override: Option<&str>,
) -> anyhow::Result<ChatSummary> {
    if let Some(existing) = get(pool, id).await? {
        return Ok(existing);
    }

    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO chats (id, name, model_override, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id)
    .bind(name)
    .bind(model_override)
    .bind(&now)
    .bind(&now)
    .execute(pool)
    .await?;

    Ok(ChatSummary {
        id: id.to_string(),
        name: name.map(str::to_string),
        model_override: model_override.map(str::to_string),
        created_at: now.clone(),
        updated_at: now,
    })
}

pub async fn delete(pool: &SqlitePool, chat_id: &str) -> anyhow::Result<bool> {
    let result = sqlx::query("DELETE FROM chats WHERE id = ?")
        .bind(chat_id)
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn touch(pool: &SqlitePool, chat_id: &str) -> anyhow::Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query("UPDATE chats SET updated_at = ? WHERE id = ?")
        .bind(now)
        .bind(chat_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_model_override(
    pool: &SqlitePool,
    chat_id: &str,
    model_override: Option<&str>,
) -> anyhow::Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query("UPDATE chats SET model_override = ?, updated_at = ? WHERE id = ?")
        .bind(model_override)
        .bind(now)
        .bind(chat_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_name(pool: &SqlitePool, chat_id: &str, name: &str) -> anyhow::Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    sqlx::query("UPDATE chats SET name = ?, updated_at = ? WHERE id = ?")
        .bind(name)
        .bind(now)
        .bind(chat_id)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn count(pool: &SqlitePool) -> anyhow::Result<i64> {
    let row: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM chats")
        .fetch_one(pool)
        .await?;
    Ok(row.0)
}

#[cfg(test)]
mod tests {
    use super::*;
    use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
    use std::str::FromStr;

    async fn test_pool() -> SqlitePool {
        let options = SqliteConnectOptions::from_str("sqlite::memory:")
            .unwrap()
            .foreign_keys(true);
        let pool = SqlitePoolOptions::new()
            .connect_with(options)
            .await
            .unwrap();
        let sql = include_str!("../../../../migrations/001_initial.sql");
        for statement in sql.split(';') {
            let s = statement.trim();
            if !s.is_empty() && !s.starts_with("--") {
                sqlx::query(s).execute(&pool).await.unwrap();
            }
        }
        pool
    }

    #[tokio::test]
    async fn create_list_delete_chat() {
        let pool = test_pool().await;
        let chat = create(&pool, "chat_test_1", Some("Test Chat"), None)
            .await
            .unwrap();
        assert_eq!(chat.id, "chat_test_1");
        assert_eq!(chat.name.as_deref(), Some("Test Chat"));

        let chats = list(&pool, 10).await.unwrap();
        assert_eq!(chats.len(), 0);

        sqlx::query(
            "INSERT INTO messages (id, chat_id, content, created_at, from_ai, response_completed)
             VALUES ('msg_1', 'chat_test_1', 'hello', datetime('now'), 0, 1)",
        )
        .execute(&pool)
        .await
        .unwrap();

        let chats = list(&pool, 10).await.unwrap();
        assert_eq!(chats.len(), 1);
        assert_eq!(chats[0].id, "chat_test_1");
    }

    #[tokio::test]
    async fn delete_empty_removes_chats_without_messages() {
        let pool = test_pool().await;
        create(&pool, "empty_chat", None, None).await.unwrap();
        assert_eq!(delete_empty(&pool).await.unwrap(), 1);
        assert!(get(&pool, "empty_chat").await.unwrap().is_none());
    }
}
