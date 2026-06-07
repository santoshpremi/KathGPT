use sqlx::SqlitePool;

use crate::llm::translate;
use crate::translate_pdf;

const MAX_EXTRACTED_CHARS: usize = 800_000;
const CHUNK_CHARS: usize = 3_500;

pub struct TranslatedFile {
    pub filename: String,
    pub mime_type: String,
    pub bytes: Vec<u8>,
}

pub async fn translate_file(
    pool: &SqlitePool,
    filename: &str,
    bytes: &[u8],
    source_language: Option<&str>,
    target_language: &str,
) -> anyhow::Result<TranslatedFile> {
    let lower = filename.to_lowercase();
    let (text, ext) = extract_text(filename, bytes, &lower)?;
    let translated = translate_long(pool, &text, source_language, target_language).await?;
    let out_name = output_filename(filename, target_language);

    let (out_bytes, mime) = match ext.as_str() {
        "pdf" => (
            translate_pdf::text_to_pdf_bytes(&out_name, &translated)?,
            "application/pdf",
        ),
        "csv" => (translated.into_bytes(), "text/csv"),
        "md" => (translated.into_bytes(), "text/markdown"),
        _ => (translated.into_bytes(), "text/plain"),
    };

    Ok(TranslatedFile {
        filename: out_name,
        mime_type: mime.to_string(),
        bytes: out_bytes,
    })
}

fn extract_text(
    filename: &str,
    bytes: &[u8],
    lower: &str,
) -> anyhow::Result<(String, String)> {
    let ext = filename
        .rsplit('.')
        .next()
        .unwrap_or("txt")
        .to_ascii_lowercase();

    let text = if lower.ends_with(".pdf") {
        pdf_extract::extract_text_from_mem(bytes)
            .map_err(|err| anyhow::anyhow!("Could not read PDF: {err}"))?
    } else if lower.ends_with(".txt") || lower.ends_with(".md") || lower.ends_with(".csv") {
        String::from_utf8(bytes.to_vec())
            .map_err(|_| anyhow::anyhow!("File is not valid UTF-8 text"))?
    } else {
        anyhow::bail!("Unsupported file type");
    };

    let trimmed = text.trim();
    if trimmed.is_empty() {
        anyhow::bail!("No text found in file");
    }
    if trimmed.len() > MAX_EXTRACTED_CHARS {
        anyhow::bail!(
            "File is too large to translate (max {} characters)",
            MAX_EXTRACTED_CHARS
        );
    }

    Ok((trimmed.to_string(), ext))
}

async fn translate_long(
    pool: &SqlitePool,
    text: &str,
    source_language: Option<&str>,
    target_language: &str,
) -> anyhow::Result<String> {
    if text.len() <= CHUNK_CHARS {
        return translate::translate_document_text(
            pool,
            text,
            source_language,
            target_language,
        )
        .await;
    }

    let chunks = chunk_on_paragraphs(text, CHUNK_CHARS);
    let total = chunks.len();
    let mut out = String::new();

    for batch_start in (0..total).step_by(2) {
        let batch_end = (batch_start + 2).min(total);
        let batch = &chunks[batch_start..batch_end];
        let mut handles = Vec::with_capacity(batch.len());
        for chunk in batch {
            let pool = pool.clone();
            let chunk = chunk.clone();
            let source = source_language.map(str::to_string);
            let target = target_language.to_string();
            handles.push(tokio::spawn(async move {
                translate::translate_document_text(
                    &pool,
                    &chunk,
                    source.as_deref(),
                    &target,
                )
                .await
            }));
        }
        for (offset, handle) in handles.into_iter().enumerate() {
            let part = handle.await??;
            if batch_start + offset > 0 {
                out.push_str("\n\n");
            }
            out.push_str(&part);
        }
    }

    Ok(out)
}

fn chunk_on_paragraphs(text: &str, max_len: usize) -> Vec<String> {
    if text.len() <= max_len {
        return vec![text.to_string()];
    }

    let mut chunks = Vec::new();
    let mut current = String::new();

    for paragraph in text.split("\n\n") {
        let piece = if current.is_empty() {
            paragraph.to_string()
        } else {
            format!("{current}\n\n{paragraph}")
        };

        if piece.len() > max_len && !current.is_empty() {
            chunks.push(current);
            current = paragraph.to_string();
        } else if piece.len() > max_len {
            for sub in split_hard(paragraph, max_len) {
                chunks.push(sub);
            }
            current.clear();
        } else {
            current = piece;
        }
    }

    if !current.is_empty() {
        chunks.push(current);
    }

    chunks
}

fn split_hard(text: &str, max_len: usize) -> Vec<String> {
    let mut parts = Vec::new();
    let mut start = 0;
    while start < text.len() {
        let end = (start + max_len).min(text.len());
        parts.push(text[start..end].to_string());
        start = end;
    }
    parts
}

fn output_filename(original: &str, target_lang: &str) -> String {
    let path = std::path::Path::new(original);
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("translated");
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("txt");
    format!("{stem}_{target_lang}.{ext}")
}
