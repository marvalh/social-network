CREATE TABLE IF NOT EXISTS group_chat_reads (
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    last_read_rowid INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (group_id, user_id),
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chat_unread ON chat(receiver_id, read_at);

UPDATE chat SET read_at = CURRENT_TIMESTAMP WHERE read_at IS NULL;

INSERT OR IGNORE INTO group_chat_reads (group_id, user_id, last_read_rowid)
SELECT gm.group_id, gm.members_id,
       COALESCE((SELECT MAX(rowid) FROM group_chat gc WHERE gc.group_id = gm.group_id), 0)
FROM group_members gm;