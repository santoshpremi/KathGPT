pub fn extract_text(filename: &str, bytes: &[u8]) -> Result<String, String> {
    let lower = filename.to_lowercase();
    if lower.ends_with(".pdf") {
        pdf_extract::extract_text_from_mem(bytes).map_err(|e| format!("Could not read PDF: {e}"))
    } else if lower.ends_with(".txt")
        || lower.ends_with(".md")
        || lower.ends_with(".csv")
        || lower.ends_with(".json")
        || lower.ends_with(".xml")
        || lower.ends_with(".html")
    {
        String::from_utf8(bytes.to_vec()).map_err(|_| "File is not valid UTF-8 text".to_string())
    } else {
        Err("Unsupported file type. Use PDF, TXT, MD, CSV, JSON, XML, or HTML.".to_string())
    }
}

pub fn summarize_tabular(filename: &str, text: &str) -> Option<String> {
    let lower = filename.to_lowercase();
    if !(lower.ends_with(".csv") || lower.ends_with(".tsv")) {
        return None;
    }

    let delimiter = if lower.ends_with(".tsv") { '\t' } else { ',' };
    let lines: Vec<&str> = text.lines().filter(|l| !l.trim().is_empty()).collect();
    if lines.is_empty() {
        return Some("Empty tabular file.".to_string());
    }

    let header: Vec<&str> = lines[0].split(delimiter).map(str::trim).collect();
    let row_count = lines.len().saturating_sub(1);
    let sample: Vec<String> = lines
        .iter()
        .skip(1)
        .take(5)
        .map(|l| l.trim().to_string())
        .collect();

    let mut summary = format!(
        "Columns ({}): {}\nData rows: {}",
        header.len(),
        header.join(", "),
        row_count
    );
    if !sample.is_empty() {
        summary.push_str("\nFirst rows:\n");
        for (i, row) in sample.iter().enumerate() {
            summary.push_str(&format!("  {}. {row}\n", i + 1));
        }
    }
    Some(summary)
}

pub fn truncate_for_llm(text: &str, max_chars: usize) -> String {
    if text.chars().count() <= max_chars {
        return text.to_string();
    }
    format!(
        "{}…\n[truncated — file continues]",
        text.chars().take(max_chars).collect::<String>()
    )
}
