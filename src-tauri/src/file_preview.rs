use std::collections::HashMap;
use std::sync::{LazyLock, Mutex};
use std::time::{Duration, Instant};

use uuid::Uuid;

struct PreviewEntry {
    bytes: Vec<u8>,
    mime_type: String,
    created: Instant,
}

static PREVIEWS: LazyLock<Mutex<HashMap<String, PreviewEntry>>> =
    LazyLock::new(|| Mutex::new(HashMap::new()));

const TTL: Duration = Duration::from_secs(3600);
const MAX_ENTRIES: usize = 32;

pub fn store(bytes: Vec<u8>, mime_type: String) -> String {
    cleanup();
    let id = Uuid::new_v4().to_string();
    PREVIEWS.lock().expect("preview lock").insert(
        id.clone(),
        PreviewEntry {
            bytes,
            mime_type,
            created: Instant::now(),
        },
    );
    id
}

pub fn get(id: &str) -> Option<(Vec<u8>, String)> {
    cleanup();
    PREVIEWS
        .lock()
        .expect("preview lock")
        .get(id)
        .map(|entry| (entry.bytes.clone(), entry.mime_type.clone()))
}

fn cleanup() {
    let mut map = PREVIEWS.lock().expect("preview lock");
    map.retain(|_, entry| entry.created.elapsed() < TTL);
    if map.len() > MAX_ENTRIES {
        let mut ids: Vec<_> = map
            .iter()
            .map(|(id, entry)| (id.clone(), entry.created))
            .collect();
        ids.sort_by_key(|(_, created)| *created);
        for (id, _) in ids.into_iter().take(map.len().saturating_sub(MAX_ENTRIES)) {
            map.remove(&id);
        }
    }
}
