use sqlx::SqlitePool;

#[derive(Debug, Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
pub struct DocumentRecord {
    pub id: String,
    pub file_name: String,
    pub file_type: String,
    pub original_size: i64,
    pub content_length: i64,
    pub tokens: i64,
    pub uploaded_by_id: String,
    pub created_at: String,
}

pub async fn insert(
    pool: &SqlitePool,
    record: &DocumentRecord,
    storage_path: &str,
) -> anyhow::Result<()> {
    sqlx::query(
        "INSERT INTO documents
         (id, file_name, file_type, original_size, content_length, tokens, storage_path, uploaded_by_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&record.id)
    .bind(&record.file_name)
    .bind(&record.file_type)
    .bind(record.original_size)
    .bind(record.content_length)
    .bind(record.tokens)
    .bind(storage_path)
    .bind(&record.uploaded_by_id)
    .bind(&record.created_at)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn read_text_for_llm(
    pool: &SqlitePool,
    id: &str,
) -> anyhow::Result<Option<(String, String)>> {
    let row: Option<(String, String)> = sqlx::query_as(
        "SELECT file_name, storage_path FROM documents WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    let Some((file_name, storage_path)) = row else {
        return Ok(None);
    };

    let bytes = std::fs::read(&storage_path)?;
    let text = crate::document_text::extract_text(&file_name, &bytes)
        .map_err(|e| anyhow::anyhow!(e))?;
    Ok(Some((file_name, text)))
}

pub async fn get(pool: &SqlitePool, id: &str) -> anyhow::Result<Option<DocumentRecord>> {
    let row: Option<(
        String,
        String,
        String,
        i64,
        i64,
        i64,
        String,
        String,
    )> = sqlx::query_as(
        "SELECT id, file_name, file_type, original_size, content_length, tokens, uploaded_by_id, created_at
         FROM documents WHERE id = ?",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    Ok(row.map(
        |(id, file_name, file_type, original_size, content_length, tokens, uploaded_by_id, created_at)| {
            DocumentRecord {
                id,
                file_name,
                file_type,
                original_size,
                content_length,
                tokens,
                uploaded_by_id,
                created_at,
            }
        },
    ))
}
