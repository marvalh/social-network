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
	UpdatedAt  sql.NullTime `json:"-"` //marked as - cuz its unused for now
}

type PendingRequest struct {
	RequestID string       `json:"requestId"`
	User      UserResponse `json:"user"` //might change userresponse since it shows full user data (unnecessary)
	CreatedAt time.Time    `json:"createdAt"`
}
