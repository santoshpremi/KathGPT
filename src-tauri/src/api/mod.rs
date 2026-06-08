pub mod artifacts;
pub mod chats;
pub mod local_models;
pub mod documents;
pub mod data;
pub mod files;
pub mod images;
pub mod messages;
pub mod model_config;
pub mod provider_keys;
pub mod research;
pub mod translate;
pub mod user;
pub mod workflows;

use axum::Router;

use crate::server::AppState;

pub fn routes() -> Router<AppState> {
    local_models::routes()
        .merge(provider_keys::routes())
        .merge(user::routes())
        .merge(chats::routes())
        .merge(messages::routes())
        .merge(model_config::routes())
        .merge(workflows::routes())
        .merge(artifacts::routes())
        .merge(images::routes())
        .merge(translate::routes())
        .merge(research::routes())
        .merge(files::routes())
        .merge(documents::routes())
        .merge(data::routes())
}
