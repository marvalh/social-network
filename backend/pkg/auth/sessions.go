package auth

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
)

// 30 days matches specs "stay logged in until you choose to log out", but might change the timer 
func CreateSession(db *sql.DB, userID string) (token string, expiresAt time.Time, err error) {
	token = uuid.NewString()
	expiresAt = time.Now().Add(30 * 24 * time.Hour)

	_, err = db.Exec(
		`INSERT INTO sessions (session_token, user_id, expires_at) VALUES (?, ?, ?)`,
		token, userID, expiresAt,
	)
	return token, expiresAt, err
}

func ValidateSession(db *sql.DB, token string) (userID string, err error) {
	err = db.QueryRow(
		`SELECT user_id FROM sessions WHERE session_token = ? AND expires_at > CURRENT_TIMESTAMP`,
		token,
	).Scan(&userID)
	return userID, err
}

func DeleteSession(db *sql.DB, token string) error {
	_, err := db.Exec(`DELETE FROM sessions WHERE session_token = ?`, token)
	return err
}

// allows only 1 active session per user
func DeleteUserSessions(db *sql.DB, userID string) error {
	_, err := db.Exec(`DELETE FROM sessions WHERE user_id = ?`, userID)
	return err
}

func CleanupExpiredSessions(db *sql.DB) error {
	_, err := db.Exec(`DELETE FROM sessions WHERE expires_at < CURRENT_TIMESTAMP`)
	return err
}