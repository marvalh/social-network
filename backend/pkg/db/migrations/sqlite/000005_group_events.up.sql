--Creating an event in a group
CREATE TABLE IF NOT EXISTS group_events (
    event_id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    event_desc TEXT,
    event_time DATETIME NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (creator_id) REFERENCES users(user_id) ON DELETE CASCADE
);

--1 response per user and per event 
CREATE TABLE IF NOT EXISTS event_responses (
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    response TEXT NOT NULL
        CHECK (response IN ('going', 'not_going')),
    responded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, user_id),
    FOREIGN KEY (event_id) REFERENCES group_events(event_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);