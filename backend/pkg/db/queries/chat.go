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

func SearchUsersInChat(db *sql.DB, query string, userID string, limit int) ([]models.User, error) {
	pattern := "%" + query + "%"
	rows, err := db.Query(
		`SELECT u.user_id, u.email, u.first_name, u.last_name, u.dob,
		        u.avatar, u.nickname, u.abt_me, u.is_public, u.created_at
		 FROM users u
		 WHERE u.user_id != ?
		   AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.nickname LIKE ?
		        OR (u.first_name || ' ' || u.last_name) LIKE ?)
		   AND (
		       EXISTS (
		           SELECT 1 FROM follows f
		           WHERE f.status = 'accepted'
		             AND ((f.follower_id = ? AND f.followee_id = u.user_id)
		               OR (f.follower_id = u.user_id AND f.followee_id = ?))
		       )
		   )
		 LIMIT ?`,
		userID, pattern, pattern, pattern, pattern, userID, userID, limit,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUserRows(rows)
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

// MarkConversationRead marks every message sent by senderID to receiverID as read.
func MarkConversationRead(db *sql.DB, receiverID, senderID string) error {
	_, err := db.Exec(
		`UPDATE chat SET read_at = CURRENT_TIMESTAMP
		 WHERE receiver_id = ? AND sender_id = ? AND read_at IS NULL`,
		receiverID, senderID,
	)
	return err
}

// MarkGroupRead records that userID has read everything currently in the group chat.
func MarkGroupRead(db *sql.DB, groupID, userID string) error {
	_, err := db.Exec(
		`INSERT INTO group_chat_reads (group_id, user_id, last_read_rowid)
		 VALUES (?, ?, COALESCE((SELECT MAX(rowid) FROM group_chat WHERE group_id = ?), 0))
		 ON CONFLICT(group_id, user_id) DO UPDATE SET last_read_rowid = excluded.last_read_rowid`,
		groupID, userID, groupID,
	)
	return err
}

// UnreadDirectCounts returns unread message counts per sender.
func UnreadDirectCounts(db *sql.DB, userID string) (map[string]int, error) {
	rows, err := db.Query(
		`SELECT sender_id, COUNT(*) FROM chat
		 WHERE receiver_id = ? AND read_at IS NULL
		 GROUP BY sender_id`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUnreadCounts(rows)
}

// UnreadGroupCounts returns unread message counts per group the user belongs to.
func UnreadGroupCounts(db *sql.DB, userID string) (map[string]int, error) {
	rows, err := db.Query(
		`SELECT gc.group_id, COUNT(*)
		 FROM group_chat gc
		 JOIN group_members gm ON gm.group_id = gc.group_id AND gm.members_id = ?
		 LEFT JOIN group_chat_reads r ON r.group_id = gc.group_id AND r.user_id = ?
		 WHERE gc.sender_id != ?
		   AND gc.rowid > COALESCE(r.last_read_rowid, 0)
		   AND gc.created_at >= gm.joined_at
		 GROUP BY gc.group_id`,
		userID, userID, userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUnreadCounts(rows)
}

func scanUnreadCounts(rows *sql.Rows) (map[string]int, error) {
	counts := map[string]int{}
	for rows.Next() {
		var id string
		var n int
		if err := rows.Scan(&id, &n); err != nil {
			return nil, err
		}
		counts[id] = n
	}
	return counts, rows.Err()
}
