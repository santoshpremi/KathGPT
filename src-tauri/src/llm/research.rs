use reqwest::Client;
use serde::Serialize;
use sqlx::SqlitePool;

use super::models::ChatMessage;
use super::router::{resolve_model_route, ModelRoute};
use crate::db::repos::provider_keys::effective_key;

const QUICK_RESEARCH_SYSTEM: &str = "You are a precise research assistant. Answer accurately and concisely.\n\n\
Format your response as a focused research brief:\n\
## Summary\n\
(2-3 sentences answering the question directly)\n\n\
## Key points\n\
(4-6 bullet points with the most important facts)\n\n\
## Details\n\
(Only if needed — short subsections, not a full paper)\n\n\
Rules:\n\
- Target 400–700 words for straightforward questions.\n\
- Place inline citations immediately after claims using [1], [2] format.\n\
- Separate multiple citations with spaces: [1] [2], never [1][2].\n\
- Prefer authoritative sources: peer-reviewed papers, official docs, reputable institutions.\n\
- Do not pad with generic background the user did not ask for.";

const DEEP_RESEARCH_SYSTEM: &str = "You are an expert research analyst producing structured research briefs.\n\n\
Format:\n\
## Executive summary\n\
## Background\n\
## Key findings\n\
## Technical details\n\
## Outlook\n\n\
Rules:\n\
- Target 800–1200 words. Be thorough but not encyclopedic.\n\
- Cite every major claim with [1], [2] immediately after the sentence.\n\
- Separate multiple citations with spaces: [1] [2], never [1][2].\n\
- Prioritize peer-reviewed papers, standards bodies, and primary sources.\n\
- Avoid repeating the same point across sections.";

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResultItem {
    pub title: String,
    pub url: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub date: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResearchResult {
    pub content: String,
    pub citations: Vec<String>,
    pub search_results: Vec<SearchResultItem>,
    pub cited_indices: Vec<usize>,
}

fn research_slug(model: &str) -> &str {
    if let Some((_, slug)) = model.split_once(':') {
        if let Some((_, tail)) = slug.rsplit_once('/') {
            return tail;
        }
        return slug;
    }
    model
}

fn is_research_model(model: &str) -> bool {
    research_slug(model).to_ascii_lowercase().contains("sonar")
}

fn is_deep_research(model: &str) -> bool {
    let slug = research_slug(model).to_ascii_lowercase();
    slug.contains("deep-research") || slug.contains("reasoning-pro")
}

fn research_system_prompt(model: &str) -> &'static str {
    if is_deep_research(model) {
        DEEP_RESEARCH_SYSTEM
    } else {
        QUICK_RESEARCH_SYSTEM
    }
}

fn research_max_tokens(model: &str) -> u32 {
    if is_deep_research(model) {
        2500
    } else {
        1200
    }
}

async fn resolve_research_route(
    pool: &SqlitePool,
    model: &str,
) -> anyhow::Result<Option<ModelRoute>> {
    if !is_research_model(model) {
        return Ok(None);
    }

    if model.contains(':') {
        return resolve_model_route(pool, model).await;
    }

    if effective_key(pool, "perplexity").await?.is_some() {
        return Ok(Some(ModelRoute::Direct {
            provider: "perplexity".to_string(),
            slug: model.to_string(),
        }));
    }

    resolve_model_route(pool, model).await
}

pub async fn run_research(
    pool: &SqlitePool,
    model: &str,
    messages: Vec<ChatMessage>,
) -> anyhow::Result<ResearchResult> {
    if messages.is_empty() {
        anyhow::bail!("At least one message is required");
    }

    if !is_research_model(model) {
        anyhow::bail!("Unsupported research model: {model}");
    }

    let route = resolve_research_route(pool, model).await?.ok_or_else(|| {
        anyhow::anyhow!(
            "No API key configured for {model}. Save a Perplexity or OpenRouter key in Settings → API Keys."
        )
    })?;

    let system_prompt = research_system_prompt(model);
    let max_tokens = research_max_tokens(model);
    let client = Client::new();

    match route {
        ModelRoute::OpenRouter { slug } => {
            let key = effective_key(pool, "openrouter")
                .await?
                .ok_or_else(|| anyhow::anyhow!("OpenRouter API key missing"))?;
            let response = client
                .post("https://openrouter.ai/api/v1/chat/completions")
                .bearer_auth(&key)
                .header("HTTP-Referer", "http://localhost:17890")
                .header("X-Title", "KathaGPT")
                .json(&openai_compatible_body(&slug, system_prompt, &messages, max_tokens))
                .send()
                .await?;
            parse_research_response(response).await
        }
        ModelRoute::Direct { provider, slug } if provider == "perplexity" => {
            let key = effective_key(pool, "perplexity")
                .await?
                .ok_or_else(|| anyhow::anyhow!("Perplexity API key missing"))?;
            let response = client
                .post("https://api.perplexity.ai/chat/completions")
                .bearer_auth(&key)
                .json(&openai_compatible_body(
                    &slug,
                    system_prompt,
                    &messages,
                    max_tokens,
                ))
                .send()
                .await?;
            parse_research_response(response).await
        }
        ModelRoute::Direct { provider, .. } => {
            anyhow::bail!("Research models must use Perplexity or OpenRouter, not {provider}")
        }
        ModelRoute::Local { .. } => {
            anyhow::bail!("Local models are not supported for research yet. Use a Perplexity or OpenRouter model.")
        }
    }
}

fn openai_compatible_body(
    model: &str,
    system_prompt: &str,
    messages: &[ChatMessage],
    max_tokens: u32,
) -> serde_json::Value {
    let mut api_messages = vec![serde_json::json!({
        "role": "system",
        "content": system_prompt,
    })];
    for message in messages {
        api_messages.push(serde_json::json!({
            "role": message.role,
            "content": message.content,
        }));
    }

    serde_json::json!({
        "model": model,
        "messages": api_messages,
        "temperature": 0.1,
        "max_tokens": max_tokens,
        "return_related_questions": false,
    })
}

async fn parse_research_response(response: reqwest::Response) -> anyhow::Result<ResearchResult> {
    if !response.status().is_success() {
        let status = response.status();
        let text = response.text().await.unwrap_or_default();
        anyhow::bail!("Research failed ({status}): {text}");
    }

    let payload: serde_json::Value = response.json().await?;
    let message = &payload["choices"][0]["message"];
    let raw_content = message["content"]
        .as_str()
        .ok_or_else(|| anyhow::anyhow!("No research content in response"))?
        .trim()
        .to_string();

    let mut citations = extract_string_array(&payload["citations"]);
    let mut search_results = extract_search_results(&payload["search_results"]);

    if citations.is_empty() {
        citations = extract_string_array(&message["citations"]);
    }

    if citations.is_empty() || search_results.is_empty() {
        let (annotation_urls, annotation_results) = extract_annotations(message);
        if citations.is_empty() {
            citations = annotation_urls;
        }
        if search_results.is_empty() {
            search_results = annotation_results;
        }
    }

    if citations.is_empty() && !search_results.is_empty() {
        citations = search_results.iter().map(|s| s.url.clone()).collect();
    }

    let source_count = citations.len().max(search_results.len());
    let cited_indices = extract_cited_indices(&raw_content, source_count);
    let content = linkify_citation_markers(&raw_content, &citations);

    Ok(ResearchResult {
        content,
        citations,
        search_results,
        cited_indices,
    })
}

fn extract_string_array(value: &serde_json::Value) -> Vec<String> {
    value
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(|s| s.to_string()))
                .collect()
        })
        .unwrap_or_default()
}

fn extract_search_results(value: &serde_json::Value) -> Vec<SearchResultItem> {
    value
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|item| {
                    let url = item["url"].as_str()?.to_string();
                    Some(SearchResultItem {
                        title: item["title"]
                            .as_str()
                            .unwrap_or(&url)
                            .to_string(),
                        url,
                        date: item["date"].as_str().map(|s| s.to_string()),
                    })
                })
                .collect()
        })
        .unwrap_or_default()
}

fn extract_annotations(message: &serde_json::Value) -> (Vec<String>, Vec<SearchResultItem>) {
    let mut urls = Vec::new();
    let mut items = Vec::new();

    let Some(annotations) = message.get("annotations").and_then(|v| v.as_array()) else {
        return (urls, items);
    };

    for ann in annotations {
        let url = ann
            .pointer("/url_citation/url")
            .and_then(|v| v.as_str())
            .or_else(|| ann.get("url").and_then(|v| v.as_str()));

        let Some(url) = url else { continue };

        let title = ann
            .pointer("/url_citation/title")
            .and_then(|v| v.as_str())
            .unwrap_or(url);

        if urls.iter().any(|u| u == url) {
            continue;
        }

        urls.push(url.to_string());
        items.push(SearchResultItem {
            title: title.to_string(),
            url: url.to_string(),
            date: None,
        });
    }

    (urls, items)
}

/// Parse a run of adjacent [n] markers, e.g. [6][10] or [3] [5].
fn parse_bracket_citation_run(
    chars: &[char],
    mut i: usize,
    max_index: usize,
) -> Option<(Vec<usize>, usize)> {
    let start = i;
    let mut nums = Vec::new();

    while i < chars.len() {
        if chars[i] == '[' {
            let mut j = i + 1;
            let mut num_str = String::new();
            while j < chars.len() && chars[j].is_ascii_digit() {
                num_str.push(chars[j]);
                j += 1;
            }
            if !num_str.is_empty() && j < chars.len() && chars[j] == ']' {
                if let Ok(n) = num_str.parse::<usize>() {
                    if (1..=max_index).contains(&n) {
                        nums.push(n);
                        i = j + 1;
                        continue;
                    }
                }
            }
        } else if chars[i].is_whitespace() {
            i += 1;
            continue;
        }
        break;
    }

    if nums.is_empty() {
        None
    } else {
        Some((nums, if i > start { i } else { start + 1 }))
    }
}

fn extract_cited_indices(content: &str, max_index: usize) -> Vec<usize> {
    if max_index == 0 {
        return Vec::new();
    }

    let chars: Vec<char> = content.chars().collect();
    let mut cited = Vec::new();
    let mut i = 0;

    while i < chars.len() {
        if chars[i] == '[' {
            if let Some((nums, end)) = parse_bracket_citation_run(&chars, i, max_index) {
                for n in nums {
                    if !cited.contains(&n) {
                        cited.push(n);
                    }
                }
                i = end;
                continue;
            }
        }
        i += 1;
    }

    cited.sort_unstable();
    cited
}

fn linkify_citation_markers(content: &str, citations: &[String]) -> String {
    if citations.is_empty() {
        return content.to_string();
    }

    let chars: Vec<char> = content.chars().collect();
    let mut result = String::new();
    let mut i = 0;

    while i < chars.len() {
        if chars[i] == '[' {
            if let Some((nums, end)) = parse_bracket_citation_run(&chars, i, citations.len()) {
                if let Some(last) = result.chars().last() {
                    if !last.is_whitespace() {
                        result.push(' ');
                    }
                }

                for (idx, n) in nums.iter().enumerate() {
                    if idx > 0 {
                        result.push_str(", ");
                    }
                    let url = &citations[n - 1];
                    result.push_str(&format!("[{n}]({url}#cite-{n})"));
                }

                i = end;
                continue;
            }
        }
        result.push(chars[i]);
        i += 1;
    }

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn linkifies_adjacent_citations_with_commas() {
        let citations = vec![
            "https://a.com".to_string(),
            "https://b.com".to_string(),
            "https://c.com".to_string(),
        ];
        let input = "Quantum networks are growing.[1][2] More text.";
        let out = linkify_citation_markers(input, &citations);
        assert!(out.contains("[1](https://a.com#cite-1), [2](https://b.com#cite-2)"));
        assert!(!out.contains("12]"));
    }

    #[test]
    fn extracts_cited_indices() {
        let input = "Claim one.[1][2] Claim two.[4]";
        let cited = extract_cited_indices(input, 10);
        assert_eq!(cited, vec![1, 2, 4]);
    }

    #[test]
    fn detects_research_models() {
        assert!(is_research_model("sonar"));
        assert!(is_research_model("perplexity:sonar-deep-research"));
        assert!(is_research_model("openrouter:perplexity/sonar-pro"));
        assert!(!is_research_model("gpt-4o-mini"));
        assert!(!is_research_model("openrouter:openai/gpt-4o"));
    }

    #[test]
    fn detects_deep_research_models() {
        assert!(is_deep_research("sonar-deep-research"));
        assert!(is_deep_research("openrouter:perplexity/sonar-reasoning-pro"));
        assert!(!is_deep_research("sonar"));
    }
}
