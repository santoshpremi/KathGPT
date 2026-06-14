use async_stream::stream;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{
        sse::{Event, KeepAlive, Sse},
        IntoResponse,
    },
    routing::{delete, get, post},
    Json, Router,
};
use futures::StreamExt;
use std::convert::Infallible;
use tokio::sync::mpsc;

use crate::db::repos::{chats, documents as doc_repo, messages as msg_repo};
use crate::document_text;
use crate::llm::models::ChatMessage;
use crate::llm::{router, stream as llm_stream};
use crate::llm::stream::StreamOptions;
use crate::models::{SendMessageRequest, StreamDeltaEvent, StreamInitEvent};
use crate::server::AppState;
use crate::tokens;

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/chats/{chat_id}/messages", get(list_messages))
        .route("/chats/{chat_id}/messages/stream", post(stream_message))
        .route(
            "/chats/{chat_id}/messages/{message_id}/following",
            delete(delete_messages_following),
        )
}

async fn delete_messages_following(
    State(state): State<AppState>,
    Path((chat_id, message_id)): Path<(String, String)>,
) -> impl IntoResponse {
    match msg_repo::delete_following(&state.db, &chat_id, &message_id).await {
        Ok(deleted) => (
            StatusCode::OK,
            Json(serde_json::json!({ "deleted": deleted })),
        )
            .into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn list_messages(
    State(state): State<AppState>,
    Path(chat_id): Path<String>,
) -> impl IntoResponse {
    match msg_repo::list_for_chat_with_id(&state.db, &chat_id).await {
        Ok(messages) => (StatusCode::OK, Json(messages)).into_response(),
        Err(err) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response(),
    }
}

async fn stream_message(
    State(state): State<AppState>,
    Path(chat_id): Path<String>,
    Json(body): Json<SendMessageRequest>,
) -> impl IntoResponse {
    if body.content.trim().is_empty() {
        return (
            StatusCode::BAD_REQUEST,
            Json(serde_json::json!({ "error": "Message content required" })),
        )
            .into_response();
    }

    if chats::get(&state.db, &chat_id).await.ok().flatten().is_none() {
        if let Err(err) = chats::create(&state.db, &chat_id, None, None).await {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": err.to_string() })),
            )
                .into_response();
        }
    }

    let pool = state.db.clone();
    let content = body.content.clone();
    let attachment_ids = body.attachment_ids.clone();
    let language = body.language.clone();
    let request_model_override = body.model_override.clone();
    let chat_model_override = chats::get(&state.db, &chat_id)
        .await
        .ok()
        .flatten()
        .and_then(|chat| chat.model_override);
    let model_override = request_model_override.or(chat_model_override);
    let temperature = body.temperature.unwrap_or(0.7);
    let suffix = body.custom_system_prompt_suffix.clone();

    let generation_model = match router::resolve_generation_model(&pool, model_override.as_deref()).await
    {
        Ok(m) => m,
        Err(err) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": err.to_string() })),
            )
                .into_response();
        }
    };

    if let Err(err) =
        msg_repo::insert_user_message(&pool, &chat_id, &content, &attachment_ids).await
    {
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(serde_json::json!({ "error": err.to_string() })),
        )
            .into_response();
    }

    let ai_message_id = msg_repo::new_message_id();
    let history = match msg_repo::list_for_chat_with_id(&pool, &chat_id).await {
        Ok(h) => h,
        Err(err) => {
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "error": err.to_string() })),
            )
                .into_response();
        }
    };

    let has_attachments = !attachment_ids.is_empty()
        || history.iter().any(|m| !m.attachment_ids.is_empty());

    let mut system_parts = vec![
        "You are KathaGPT, a helpful enterprise AI assistant.".to_string(),
        if !language.is_empty() {
            format!("Respond in {language}.")
        } else {
            String::new()
        },
    ];
    if has_attachments {
        system_parts.push(
            "The user attached files for analysis. Provide substantive analysis: what the data/document is, field meanings, distributions/patterns, anomalies, and practical insights. Use markdown headings and bullets. Do not just repeat raw cell values back. If the dataset is tiny, note that briefly and still give useful context.".to_string(),
        );
    }
    if let Some(s) = suffix.filter(|s| !s.is_empty()) {
        system_parts.push(s);
    }

    let mut chat_messages: Vec<ChatMessage> = vec![ChatMessage {
        role: "system".to_string(),
        content: system_parts.join("\n"),
    }];

    for msg in history {
        let llm_content = if msg.from_ai {
            msg.content.clone()
        } else {
            augment_with_attachments(&pool, &msg.content, &msg.attachment_ids).await
        };
        chat_messages.push(ChatMessage {
            role: if msg.from_ai {
                "assistant"
            } else {
                "user"
            }
            .to_string(),
            content: llm_content,
        });
    }

    let context_window = tokens::context_window_for_model(&generation_model);
    let (chat_messages, truncated_count) =
        tokens::fit_messages_to_context(chat_messages, context_window, 4096);
    if truncated_count > 0 {
        tracing::info!(
            "Truncated {truncated_count} older messages to fit {context_window} token context for {generation_model}"
        );
    }

    let (event_tx, mut event_rx) = mpsc::unbounded_channel::<Result<Event, Infallible>>();
    let pool_bg = pool.clone();
    let chat_id_bg = chat_id.clone();
    let ai_id_bg = ai_message_id.clone();
    let model_bg = generation_model.clone();

    tokio::spawn(async move {
        let mut full_response = String::new();
        let run = async {
        let llm_result = llm_stream::stream_completion(
            &pool_bg,
            &model_bg,
            StreamOptions {
                messages: chat_messages,
                temperature,
                max_tokens: 4096,
            },
        )
        .await;

        match llm_result {
            Ok(mut llm_stream) => {
                while let Some(delta) = llm_stream.next().await {
                    match delta {
                        Ok(d) => {
                            full_response.push_str(&d);
                            let evt = StreamDeltaEvent {
                                delta: d,
                                content: full_response.clone(),
                                citations: vec![],
                            };
                            if let Ok(data) = serde_json::to_string(&evt) {
                                let _ = event_tx.send(Ok(Event::default().event("delta").data(data)));
                            }
                        }
                        Err(err) => {
                            full_response = format!(
                                "Sorry, I could not generate a response. Check your API key in Settings, or verify your internet connection. ({err})"
                            );
                            break;
                        }
                    }
                }
            }
            Err(err) => {
                full_response = format!(
                    "Sorry, I could not generate a response. Add an API key in Settings → API Keys. ({err})"
                );
            }
        }

        let _ = msg_repo::insert_ai_message(
            &pool_bg,
            &chat_id_bg,
            &ai_id_bg,
            &full_response,
            &model_bg,
        )
        .await;

        if let Ok(data) = serde_json::to_string(&serde_json::json!({
            "content": full_response,
            "citations": [],
        })) {
            let _ = event_tx.send(Ok(Event::default().event("done").data(data)));
        }
        Ok::<(), anyhow::Error>(())
        };

        if let Err(err) = run.await {
            let _ = event_tx.send(Ok(
                Event::default()
                    .event("error")
                    .data(format!("Generation failed: {err}")),
            ));
        }
    });

    let init = StreamInitEvent {
        ai_message_id: ai_message_id.clone(),
        generation_model: generation_model.clone(),
    };

    let sse_stream = stream! {
        if let Ok(data) = serde_json::to_string(&init) {
            yield Ok::<Event, Infallible>(Event::default().event("init").data(data));
        }

        while let Some(event) = event_rx.recv().await {
            yield event;
        }
    };

    Sse::new(sse_stream)
        .keep_alive(KeepAlive::default())
        .into_response()
}

async fn augment_with_attachments(
    pool: &sqlx::SqlitePool,
    content: &str,
    attachment_ids: &[String],
) -> String {
    if attachment_ids.is_empty() {
        return content.to_string();
    }

    let mut out = content.to_string();
    out.push_str("\n\n[User attached files for analysis]");
    for id in attachment_ids {
        match doc_repo::read_text_for_llm(pool, id).await {
            Ok(Some((name, text))) => {
                let truncated = document_text::truncate_for_llm(&text, 24_000);
                let summary = document_text::summarize_tabular(&name, &text)
                    .map(|s| format!("\nSummary:\n{s}"))
                    .unwrap_or_default();
                out.push_str(&format!(
                    "\n\n--- File: {name} ---{summary}\n\nContent:\n{truncated}"
                ));
            }
            Ok(None) => {
                out.push_str(&format!("\n\n### (missing attachment: {id})"));
            }
            Err(err) => {
                out.push_str(&format!("\n\n### (could not read attachment: {err})"));
            }
        }
    }
    out
}
