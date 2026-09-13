--Images
CREATE TABLE IF NOT EXISTS images (
    img_id TEXT PRIMARY KEY,
    owner_id TEXT NOT NULL,
    path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE
);