package models

import (
	"database/sql"
	"time"
)

type Message struct {
	ChatID     string       `json:"chatId"`
	SenderID   string       `json:"senderId"`
	ReceiverID string       `json:"receiverId"`
	Content    string       `json:"content"`
	ReadAt     sql.NullTime `json:"readAt"`
	CreatedAt  time.Time    `json:"createdAt"`
}

type GroupMessage struct {
	ChatID    string       `json:"chatId"`
	SenderID  string       `json:"senderId"`
	GroupID   string       `json:"groupId"`
	Content   string       `json:"content"`
	ReadAt    sql.NullTime `json:"readAt"`
	CreatedAt time.Time    `json:"createdAt"`
}

type SendMessageRequest struct {
	Content string `json:"content"`
}
