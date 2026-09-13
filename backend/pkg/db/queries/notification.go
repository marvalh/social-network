package queries

import (
	"database/sql"

	"github.com/google/uuid"
	"social-network-test/pkg/models"
)

func InsertNotification(db *sql.DB, userID, notifType string, referenceID *string) (string, error) {
	notifID := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO notifications (notif_id, user_id, type, reference_id) VALUES (?, ?, ?, ?)`,
		notifID, userID, notifType, referenceID,
	)
	if err != nil {
		return "", err
	}
	return notifID, nil
}

func ListNotifications(db *sql.DB, userID string) ([]models.Notification, error) {
	rows, err := db.Query(
		`SELECT notif_id, user_id, type, reference_id, is_read, created_at
		 FROM notifications
		 WHERE user_id = ?
		 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notifications := []models.Notification{}
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(&n.NotifID, &n.UserID, &n.Type, &n.ReferenceID, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifications = append(notifications, n)
	}
	return notifications, rows.Err()
}

func MarkRead(db *sql.DB, notifID, userID string) error {
	_, err := db.Exec(
		`UPDATE notifications SET is_read = 1 WHERE notif_id = ? AND user_id = ?`,
		notifID, userID,
	)
	return err
}

func UnreadCount(db *sql.DB, userID string) (int, error) {
	var count int
	err := db.QueryRow(
		`SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0`,
		userID,
	).Scan(&count)
	return count, err
}