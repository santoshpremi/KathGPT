use serde::{Deserialize, Serialize};

pub const PROVIDER_IDS: [&str; 5] = [
    "openrouter",
    "openai",
    "anthropic",
    "gemini",
    "perplexity",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProviderKeyStatus {
    pub id: String,
    pub configured: bool,
    pub source: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub masked_key: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct SetProviderKeyRequest {
    pub provider: String,
    pub api_key: String,
}

#[derive(Debug, Deserialize)]
pub struct TestProviderKeyRequest {
    pub provider: String,
    #[serde(default)]
    pub api_key: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TestProviderKeyResponse {
    pub ok: bool,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UserProfile {
    pub id: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub locale: String,
    pub default_model: String,
    pub accepted_guidelines: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChatSummary {
    pub id: String,
    pub name: Option<String>,
    pub model_override: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateChatRequest {
    pub id: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub model_override: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateChatRequest {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub model_override: Option<String>,
    /// When true, apply `model_override` (including `None` to clear).
    #[serde(default)]
    pub set_model_override: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Message {
    pub id: String,
    pub content: String,
    pub created_at: String,
    pub from_ai: bool,
    #[serde(default)]
    pub response_completed: Option<bool>,
    #[serde(default)]
    pub author_id: Option<String>,
    pub chat_id: String,
    #[serde(default)]
    pub generation_model: Option<String>,
    #[serde(default)]
    pub attachment_ids: Vec<String>,
    #[serde(default)]
    pub rag_sources: Vec<serde_json::Value>,
    #[serde(default)]
    pub citations: Vec<String>,
    #[serde(default)]
    pub artifact_version_id: Option<String>,
    #[serde(default)]
    pub cancelled: Option<bool>,
    #[serde(default)]
    pub error_code: Option<String>,
    #[serde(default)]
    pub tokens: i64,
    #[serde(default)]
    pub output_document_url: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SendMessageRequest {
    pub content: String,
    #[serde(default = "default_language")]
    pub language: String,
    #[serde(default)]
    pub model_override: Option<String>,
    #[serde(default)]
    pub temperature: Option<f32>,
    #[serde(default)]
    pub custom_system_prompt_suffix: Option<String>,
    #[serde(default)]
    pub attachment_ids: Vec<String>,
}

fn default_language() -> String {
    "en".to_string()
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StreamInitEvent {
    pub ai_message_id: String,
    pub generation_model: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StreamDeltaEvent {
    pub delta: String,
    pub content: String,
    pub citations: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkflowStep {
    pub id: String,
    pub order: i32,
    pub prompt_template: String,
    pub model_override: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Workflow {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub index: i32,
    pub department_id: String,
    pub steps: Vec<WorkflowStep>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateWorkflowRequest {
    pub id: String,
    pub name: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default = "default_department")]
    pub department_id: String,
    #[serde(default)]
    pub steps: Vec<WorkflowStep>,
}

fn default_department() -> String {
    "personal".to_string()
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateWorkflowRequest {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub department_id: Option<String>,
    #[serde(default)]
    pub index: Option<i32>,
    #[serde(default)]
    pub steps: Option<Vec<WorkflowStep>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Artifact {
    pub id: String,
    pub chat_id: String,
    pub title: String,
    pub content: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ArtifactVersion {
    pub id: String,
    pub artifact_id: String,
    pub content: String,
    pub version: i32,
    pub from_chat: bool,
    pub created_at: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateUserRequest {
    #[serde(default)]
    pub first_name: Option<String>,
    #[serde(default)]
    pub last_name: Option<String>,
    #[serde(default)]
    pub locale: Option<String>,
    #[serde(default)]
    pub default_model: Option<String>,
    #[serde(default)]
    pub accepted_guidelines: Option<bool>,
}
