CREATE TABLE IF NOT EXISTS documents (
    id              TEXT PRIMARY KEY,
    file_name       TEXT NOT NULL,
    file_type       TEXT NOT NULL,
    original_size   INTEGER NOT NULL,
    content_length  INTEGER NOT NULL,
    tokens          INTEGER NOT NULL DEFAULT 0,
    storage_path    TEXT NOT NULL,
    uploaded_by_id  TEXT NOT NULL DEFAULT 'local-user',
    created_at      TEXT NOT NULL
);
