package models

import (
	"database/sql"
	"time"
)

type Notification struct {
	NotifID     string        `json:"notifId"`
	UserID      string        `json:"userId"`
	Type        string        `json:"type"`
	ReferenceID sql.NullInt64 `json:"referenceId,omitempty"`
	IsRead      bool          `json:"isRead"`
	CreatedAt   time.Time     `json:"createdAt"`
}
