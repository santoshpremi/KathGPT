use sqlx::SqlitePool;

use crate::models::Message;

pub fn new_message_id() -> String {
    let raw = uuid::Uuid::new_v4().to_string().replace('-', "");
    format!("msg_{}", &raw[..24.min(raw.len())])
}

pub async fn list_for_chat(pool: &SqlitePool, chat_id: &str) -> anyhow::Result<Vec<Message>> {
    let rows: Vec<(
        String,
        String,
        String,
        i64,
        i64,
        Option<String>,
        Option<String>,
        Option<String>,
        i64,
    )> = sqlx::query_as(
        "SELECT id, content, created_at, from_ai, response_completed, generation_model,
                attachment_ids, citations, cancelled
         FROM messages WHERE chat_id = ?
         ORDER BY created_at ASC",
    )
    .bind(chat_id)
    .fetch_all(pool)
    .await?;

    Ok(rows.into_iter().map(row_to_message).collect())
}

pub async fn count_for_chat(pool: &SqlitePool, chat_id: &str) -> anyhow::Result<i64> {
    let row: (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM messages WHERE chat_id = ?")
            .bind(chat_id)
            .fetch_one(pool)
            .await?;
    Ok(row.0)
}

pub async fn insert(pool: &SqlitePool, message: &Message) -> anyhow::Result<()> {
    let attachments = serde_json::to_string(&message.attachment_ids)?;
    let citations = serde_json::to_string(&message.citations)?;
    sqlx::query(
        "INSERT INTO messages (id, chat_id, content, from_ai, generation_model, response_completed,
         cancelled, attachment_ids, citations, error_code, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&message.id)
    .bind(&message.chat_id)
    .bind(&message.content)
    .bind(message.from_ai as i64)
    .bind(&message.generation_model)
    .bind(message.response_completed.unwrap_or(true) as i64)
    .bind(message.cancelled.unwrap_or(false) as i64)
    .bind(attachments)
    .bind(citations)
    .bind(&message.error_code)
    .bind(&message.created_at)
    .execute(pool)
    .await?;
    Ok(())
}

fn row_to_message(
    row: (
        String,
        String,
        String,
        i64,
        i64,
        Option<String>,
        Option<String>,
        Option<String>,
        i64,
    ),
) -> Message {
    let attachment_ids: Vec<String> = row
        .6
        .as_deref()
        .and_then(|s| serde_json::from_str(s).ok())
        .unwrap_or_default();
    let citations: Vec<String> = row
        .7
        .as_deref()
        .and_then(|s| serde_json::from_str(s).ok())
        .unwrap_or_default();

    let content = row.1.clone();

    Message {
        id: row.0,
        content,
        created_at: row.2,
        from_ai: row.3 != 0,
        response_completed: Some(row.4 != 0),
        author_id: None,
        chat_id: String::new(), // filled by caller
        generation_model: row.5,
        attachment_ids,
        citations,
        artifact_version_id: None,
        cancelled: Some(row.8 != 0),
        error_code: None,
        tokens: crate::tokens::estimate_tokens(&row.1),
        output_document_url: None,
        rag_sources: vec![],
    }
}

pub async fn list_for_chat_with_id(
    pool: &SqlitePool,
    chat_id: &str,
) -> anyhow::Result<Vec<Message>> {
    let mut messages = list_for_chat(pool, chat_id).await?;
    for m in &mut messages {
        m.chat_id = chat_id.to_string();
    }
    Ok(messages)
}

fn derive_chat_title(content: &str) -> String {
    let trimmed = content.trim().split_whitespace().collect::<Vec<_>>().join(" ");
    if trimmed.chars().count() <= 48 {
        trimmed
    } else {
        format!("{}…", trimmed.chars().take(48).collect::<String>())
    }
}

pub async fn insert_user_message(
    pool: &SqlitePool,
    chat_id: &str,
    content: &str,
    attachment_ids: &[String],
) -> anyhow::Result<(String, bool)> {
    let count = count_for_chat(pool, chat_id).await?;
    let is_first = count == 0;
    let id = new_message_id();
    let now = chrono::Utc::now().to_rfc3339();

    let message = Message {
        id: id.clone(),
        content: content.to_string(),
        created_at: now,
        from_ai: false,
        response_completed: Some(true),
        author_id: None,
        chat_id: chat_id.to_string(),
        generation_model: None,
        attachment_ids: attachment_ids.to_vec(),
        citations: vec![],
        artifact_version_id: None,
        cancelled: Some(false),
        error_code: None,
        tokens: crate::tokens::estimate_tokens(content),
        output_document_url: None,
        rag_sources: vec![],
    };
    insert(pool, &message).await?;

    if is_first {
        super::chats::set_name(pool, chat_id, &derive_chat_title(content)).await?;
    } else {
        super::chats::touch(pool, chat_id).await?;
    }

    Ok((id, is_first))
}

pub async fn insert_ai_message(
    pool: &SqlitePool,
    chat_id: &str,
    id: &str,
    content: &str,
    generation_model: &str,
) -> anyhow::Result<()> {
    let now = chrono::Utc::now().to_rfc3339();
    let message = Message {
        id: id.to_string(),
        content: content.to_string(),
        created_at: now,
        from_ai: true,
        response_completed: Some(true),
        author_id: None,
        chat_id: chat_id.to_string(),
        generation_model: Some(generation_model.to_string()),
        attachment_ids: vec![],
        citations: vec![],
        artifact_version_id: None,
        cancelled: Some(false),
        error_code: None,
        tokens: crate::tokens::estimate_tokens(content),
        output_document_url: None,
        rag_sources: vec![],
    };
    insert(pool, &message).await?;
    super::chats::touch(pool, chat_id).await?;
    Ok(())
}

pub async fn delete_following(
    pool: &SqlitePool,
    chat_id: &str,
    message_id: &str,
) -> anyhow::Result<u64> {
    let row: Option<(String,)> = sqlx::query_as(
        "SELECT created_at FROM messages WHERE id = ? AND chat_id = ?",
    )
    .bind(message_id)
    .bind(chat_id)
    .fetch_optional(pool)
    .await?;

    let created_at = row
        .ok_or_else(|| anyhow::anyhow!("Message not found"))?
        .0;

    let result = sqlx::query(
        "DELETE FROM messages WHERE chat_id = ? AND created_at >= ?",
    )
    .bind(chat_id)
    .bind(created_at)
    .execute(pool)
    .await?;

    super::chats::touch(pool, chat_id).await?;
    Ok(result.rows_affected())
}
