CREATE INDEX idx_group_members_user ON group_members(members_id);
CREATE INDEX idx_group_invite_invited_to ON group_invite(invited_to, status);
CREATE INDEX idx_group_join_request_group ON group_join_request(group_id, status);
CREATE INDEX idx_group_events_group ON group_events(group_id);
CREATE INDEX idx_group_chat_group_created ON group_chat(group_id, created_at);