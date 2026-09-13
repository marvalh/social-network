--Creating a group
CREATE TABLE IF NOT EXISTS groups(
    group_id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    title TEXT NOT NULL,
    grp_desc TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(creator_id) REFERENCES users(user_id) ON DELETE CASCADE
);

--Members in a group
CREATE TABLE IF NOT EXISTS group_members(
    group_id TEXT NOT NULL,
    members_id TEXT NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, members_id),
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (members_id) REFERENCES users(user_id) ON DELETE CASCADE
);

--Inviting users to a group
CREATE TABLE IF NOT EXISTS group_invite(
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    invited_by TEXT NOT NULL,    --user inviting 
    invited_to TEXT NOT NULL,    --user being invited
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK(status IN ('pending', 'accepted', 'declined')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY(invited_by) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (invited_to) REFERENCES users(user_id) ON DELETE CASCADE
);

--Requesting to join a group
CREATE TABLE IF NOT EXISTS group_join_request (
    group_id TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, requested_by),
    FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES users(user_id) ON DELETE CASCADE
);
