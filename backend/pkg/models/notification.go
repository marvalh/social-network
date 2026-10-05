package models

import (
	"time"
)

type Notification struct {
	NotifID     string    `json:"notifId"`
	UserID      string    `json:"userId"`
	Type        string    `json:"type"`
	ReferenceID *string   `json:"referenceId,omitempty"`
	ActorID     *string   `json:"actorId,omitempty"`
	ActorName   string    `json:"actorName,omitempty"`
	ActorAvatar *string   `json:"actorAvatar,omitempty"`
	IsRead      bool      `json:"isRead"`
	CreatedAt   time.Time `json:"createdAt"`
}
