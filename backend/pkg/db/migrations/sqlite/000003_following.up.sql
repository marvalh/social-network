--Follow requests
CREATE TABLE IF NOT EXISTS follows(
    id TEXT PRIMARY KEY,
    follower_id TEXT NOT NULL, --user requesting to follow
    followee_id TEXT NOT NULL, --user being followed 
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME,

    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (followee_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (follower_id, followee_id)
);