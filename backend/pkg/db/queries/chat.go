package queries

import (
	"database/sql"

	"social-network-test/pkg/models"

	"github.com/google/uuid"
)

func InsertMessage(db *sql.DB, senderID, receiverID string, content string) (string, error) {
	chatID := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO chat (chat_id, sender_id, receiver_id, content) VALUES (?, ?, ?, ?)`,
		chatID, senderID, receiverID, content,
	)
	if err != nil {
		return "", err
	}
	return chatID, nil
}

func ListConversation(db *sql.DB, userA, userB string) ([]models.Message, error) {
	rows, err := db.Query(
		`SELECT chat_id, sender_id, receiver_id, content, read_at, created_at
		 FROM chat
		 WHERE (sender_id = ? AND receiver_id = ?)
		    OR (sender_id = ? AND receiver_id = ?)
		 ORDER BY created_at`,
		userA, userB, userB, userA,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := []models.Message{}
	for rows.Next() {
		var m models.Message
		if err := rows.Scan(&m.ChatID, &m.SenderID, &m.ReceiverID, &m.Content, &m.ReadAt, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, rows.Err()
}

func InsertGroupMessage(db *sql.DB, groupID, senderID string, content string) (string, error) {
	chatID := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO group_chat (chat_id, group_id, sender_id, content) VALUES (?, ?, ?, ?)`,
		chatID, groupID, senderID, content,
	)
	if err != nil {
		return "", err
	}
	return chatID, nil
}

func ListGroupMessages(db *sql.DB, groupID string) ([]models.GroupMessage, error) {
	rows, err := db.Query(
		`SELECT chat_id, group_id, sender_id, content, read_at, created_at
		 FROM group_chat
		 WHERE group_id = ?
		 ORDER BY created_at`,
		groupID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	messages := []models.GroupMessage{}
	for rows.Next() {
		var m models.GroupMessage
		if err := rows.Scan(&m.ChatID, &m.GroupID, &m.SenderID, &m.Content, &m.ReadAt, &m.CreatedAt); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, rows.Err()
}

func ListConversations(db *sql.DB, userID string) ([]models.ConversationSummary, error) {
	rows, err := db.Query(
		`SELECT u.user_id, u.first_name, u.last_name, u.avatar,
		        c.content, c.created_at
		 FROM users u
		 JOIN (
		     SELECT
		         CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END AS other_id,
		         content, created_at,
		         ROW_NUMBER() OVER (
		             PARTITION BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
		             ORDER BY created_at DESC
		         ) AS rn
		     FROM chat
		     WHERE sender_id = ? OR receiver_id = ?
		 ) c ON c.other_id = u.user_id AND c.rn = 1
		 ORDER BY c.created_at DESC`,
		userID, userID, userID, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	conversations := []models.ConversationSummary{}
	for rows.Next() {
		var c models.ConversationSummary
		if err := rows.Scan(&c.UserID, &c.FirstName, &c.LastName, &c.Avatar,
			&c.LastMessage, &c.LastMessageAt); err != nil {
			return nil, err
		}
		conversations = append(conversations, c)
	}
	return conversations, rows.Err()
}
