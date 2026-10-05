package queries

import (
	"database/sql"

	"social-network-test/pkg/models"

	"github.com/google/uuid"
)

const notificationSelect = `SELECT n.notif_id, n.user_id, n.type, n.reference_id, n.actor_id,
	TRIM(COALESCE(u.first_name, '') || ' ' || COALESCE(u.last_name, '')),
	u.avatar, n.is_read, n.created_at
	FROM notifications n
	LEFT JOIN users u ON u.user_id = n.actor_id`

type notifScanner interface {
	Scan(dest ...any) error
}

func scanNotif(row notifScanner) (models.Notification, error) {
	var n models.Notification
	err := row.Scan(&n.NotifID, &n.UserID, &n.Type, &n.ReferenceID, &n.ActorID,
		&n.ActorName, &n.ActorAvatar, &n.IsRead, &n.CreatedAt)
	return n, err
}

func InsertNotification(db *sql.DB, userID, actorID, notifType string, referenceID *string) (string, error) {
	notifID := uuid.NewString()

	var actor *string
	if actorID != "" {
		actor = &actorID
	}

	_, err := db.Exec(
		`INSERT INTO notifications (notif_id, user_id, type, reference_id, actor_id) VALUES (?, ?, ?, ?, ?)`,
		notifID, userID, notifType, referenceID, actor,
	)
	if err != nil {
		return "", err
	}
	return notifID, nil
}

func GetNotification(db *sql.DB, notifID string) (models.Notification, error) {
	return scanNotif(db.QueryRow(notificationSelect+` WHERE n.notif_id = ?`, notifID))
}

func ListNotifications(db *sql.DB, userID string) ([]models.Notification, error) {
	rows, err := db.Query(
		notificationSelect+` WHERE n.user_id = ? ORDER BY n.created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	notifications := []models.Notification{}
	for rows.Next() {
		n, err := scanNotif(rows)
		if err != nil {
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
