package models

import (
	"time"
)

type Notification struct {
	NotifID     string    `json:"notifId"`
	UserID      string    `json:"userId"`
	Type        string    `json:"type"`
	ReferenceID *string   `json:"referenceId,omitempty"`
	IsRead      bool      `json:"isRead"`
	CreatedAt   time.Time `json:"createdAt"`
}
