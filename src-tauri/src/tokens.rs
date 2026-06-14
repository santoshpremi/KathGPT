use crate::llm::model_catalog;
use crate::llm::models::ChatMessage;

/// Rough token estimate (~4 characters per token). Matches frontend heuristic.
pub fn estimate_tokens(text: &str) -> i64 {
    let chars = text.chars().count();
    if chars == 0 {
        0
    } else {
        ((chars as f64) / 4.0).ceil() as i64
    }
}

pub fn context_window_for_model(model: &str) -> u32 {
    let slug = model.strip_prefix("local:").unwrap_or(model);

    if model_catalog::find(slug).is_some() || model.starts_with("local:") {
        return crate::llm::sidecar::context_window_for(slug);
    }

    match slug {
        "gpt-4o" | "gpt-4o-mini" | "o1-us" | "o3-mini" | "llama-3.3-fast" => 128_000,
        "claude-3-7-sonnet" | "claude-3-7-sonnet-thinking" => 200_000,
        "gemini-1.5-pro" => 2_000_000,
        "gemini-2.0-flash" => 1_000_000,
        "sonar" | "sonar-deep-research" | "deepseek-v3" | "deepseek-r1" => 128_000,
        _ => 128_000,
    }
}

/// Drop oldest non-system messages until the prompt fits the context budget.
pub fn fit_messages_to_context(
    mut messages: Vec<ChatMessage>,
    context_window: u32,
    output_reserve: u32,
) -> (Vec<ChatMessage>, usize) {
    if messages.is_empty() {
        return (messages, 0);
    }

    let budget = context_window.saturating_sub(output_reserve) as i64;
    let mut dropped = 0usize;

    while messages.len() > 2 && total_tokens(&messages) > budget {
        messages.remove(1);
        dropped += 1;
    }

    (messages, dropped)
}

fn total_tokens(messages: &[ChatMessage]) -> i64 {
    messages
        .iter()
        .map(|m| estimate_tokens(&m.content))
        .sum()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn truncates_oldest_messages_first() {
        let messages = vec![
            ChatMessage {
                role: "system".to_string(),
                content: "sys".to_string(),
            },
            ChatMessage {
                role: "user".to_string(),
                content: "a".repeat(4000),
            },
            ChatMessage {
                role: "assistant".to_string(),
                content: "b".repeat(4000),
            },
            ChatMessage {
                role: "user".to_string(),
                content: "latest".to_string(),
            },
        ];
        let (trimmed, dropped) = fit_messages_to_context(messages, 2500, 500);
        assert!(dropped >= 1);
        assert!(trimmed.last().unwrap().content.contains("latest"));
    }
}
