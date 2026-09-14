package queries

import (
	"database/sql"

	"social-network-test/pkg/models"

	"github.com/google/uuid"
)

func GetFollowStatus(db *sql.DB, followerID, followeeID string) (string, error) {
	if followerID == followeeID {
		return "self", nil
	}
	var status string
	err := db.QueryRow(
		`SELECT status FROM follows WHERE follower_id = ? AND followee_id = ?`,
		followerID, followeeID,
	).Scan(&status)
	if err == sql.ErrNoRows {
		return "none", nil
	}
	if err != nil {
		return "", err
	}
	return status, nil
}

func IsFollowing(db *sql.DB, followerID, followeeID string) (bool, error) {
	status, err := GetFollowStatus(db, followerID, followeeID)
	if err != nil {
		return false, err
	}
	return status == "accepted", nil
}

func FollowerCount(db *sql.DB, userID string) (int, error) {
	var count int
	err := db.QueryRow(
		`SELECT COUNT(*) FROM follows WHERE followee_id = ? AND status = 'accepted'`,
		userID,
	).Scan(&count)
	return count, err
}

func FollowingCount(db *sql.DB, userID string) (int, error) {
	var count int
	err := db.QueryRow(
		`SELECT COUNT(*) FROM follows WHERE follower_id = ? AND status = 'accepted'`,
		userID,
	).Scan(&count)
	return count, err
}

func ListFollowers(db *sql.DB, userID string) ([]models.User, error) {
	rows, err := db.Query(
		`SELECT u.user_id, u.email, u.first_name, u.last_name, u.dob,
		        u.avatar, u.nickname, u.abt_me, u.is_public, u.created_at
		 FROM users u
		 JOIN follows f ON f.follower_id = u.user_id
		 WHERE f.followee_id = ? AND f.status = 'accepted'
		 ORDER BY u.first_name, u.last_name`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUserRows(rows)
}

func ListFollowing(db *sql.DB, userID string) ([]models.User, error) {
	rows, err := db.Query(
		`SELECT u.user_id, u.email, u.first_name, u.last_name, u.dob,
		        u.avatar, u.nickname, u.abt_me, u.is_public, u.created_at
		 FROM users u
		 JOIN follows f ON f.followee_id = u.user_id
		 WHERE f.follower_id = ? AND f.status = 'accepted'
		 ORDER BY u.first_name, u.last_name`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	return scanUserRows(rows)
}

func PendingRequestCount(db *sql.DB, userID string) (int, error) {
	var count int
	err := db.QueryRow(
		`SELECT COUNT(*) FROM follows WHERE followee_id = ? AND status = 'pending'`,
		userID,
	).Scan(&count)
	return count, err
}

func ListPendingRequests(db *sql.DB, userID string) ([]models.PendingRequest, error) {
	rows, err := db.Query(
		`SELECT f.id, f.created_at,
		        u.user_id, u.email, u.first_name, u.last_name, u.dob,
		        u.avatar, u.nickname, u.abt_me, u.is_public, u.created_at
		 FROM follows f
		 JOIN users u ON u.user_id = f.follower_id
		 WHERE f.followee_id = ? AND f.status = 'pending'
		 ORDER BY f.created_at`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := []models.PendingRequest{}
	for rows.Next() {
		var pr models.PendingRequest
		var u models.User
		if err := rows.Scan(&pr.RequestID, &pr.CreatedAt,
			&u.UserID, &u.Email, &u.FirstName, &u.LastName, &u.DOB,
			&u.Avatar, &u.Nickname, &u.AboutMe, &u.IsPublic, &u.CreatedAt); err != nil {
			return nil, err
		}
		pr.User = u.Sanitize()
		requests = append(requests, pr)
	}
	return requests, rows.Err()
}

func scanUserRows(rows *sql.Rows) ([]models.User, error) {
	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.UserID, &u.Email, &u.FirstName, &u.LastName, &u.DOB,
			&u.Avatar, &u.Nickname, &u.AboutMe, &u.IsPublic, &u.CreatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

func GetFollowByID(db *sql.DB, id string) (*models.Follow, error) {
	var f models.Follow
	err := db.QueryRow(
		`SELECT id, follower_id, followee_id, status, created_at, updated_at
		 FROM follows WHERE id = ?`,
		id,
	).Scan(&f.ID, &f.FollowerID, &f.FolloweeID, &f.Status, &f.CreatedAt, &f.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &f, nil
}

func UpsertFollowRequest(db *sql.DB, followerID, followeeID, status string) (bool, error) {
	result, err := db.Exec(
		`INSERT INTO follows (id, follower_id, followee_id, status)
		 VALUES (?, ?, ?, ?)
		 ON CONFLICT(follower_id, followee_id)
		 DO UPDATE SET status = excluded.status, updated_at = CURRENT_TIMESTAMP
		 WHERE follows.status = 'declined'`,
		uuid.NewString(), followerID, followeeID, status,
	)
	if err != nil {
		return false, err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return rows > 0, nil
}

func UpdateFollowStatus(db *sql.DB, id, status string) error {
	_, err := db.Exec(
		`UPDATE follows SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
		status, id,
	)
	return err
}

func DeleteFollow(db *sql.DB, id string) error {
	_, err := db.Exec(`DELETE FROM follows WHERE id = ?`, id)
	return err
}

func RemoveAcceptedFollow(db *sql.DB, followerID, followeeID string) error {
	_, err := db.Exec(
		`DELETE FROM follows WHERE follower_id = ? AND followee_id = ? AND status = 'accepted'`,
		followerID, followeeID,
	)
	return err
}

func GetFollowID(db *sql.DB, followerID, followeeID string) (string, error) {
	var id string
	err := db.QueryRow(
		`SELECT id FROM follows WHERE follower_id = ? AND followee_id = ?`,
		followerID, followeeID,
	).Scan(&id)
	return id, err
}
