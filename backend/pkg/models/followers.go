package models

import (
	"database/sql"
	"time"
)

type Follow struct {
	ID         string       `json:"id"`
	FollowerID string       `json:"followerId"`
	FolloweeID string       `json:"followeeId"`
	Status     string       `json:"status"`
	CreatedAt  time.Time    `json:"createdAt"`
	UpdatedAt  sql.NullTime `json:"-"`
}

type PendingRequest struct {
	RequestID string      `json:"requestId"`
	User      UserPreview `json:"user"`
	CreatedAt time.Time   `json:"createdAt"`
}
