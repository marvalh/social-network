package queries

import (
	"database/sql"

	"social-network-test/pkg/models"

	"github.com/google/uuid"
)

func CreateUser(db *sql.DB, u models.User) (string, error) {
	u.UserID = uuid.NewString();
	_, err := db.Exec(
		`INSERT INTO users (user_id, email, password, first_name, last_name, dob, avatar, nickname, abt_me)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		u.UserID, u.Email, u.Password, u.FirstName, u.LastName, u.DOB,
		u.Avatar, u.Nickname, u.AboutMe,
	)
	if err != nil {
		return "", err
	}
	return u.UserID, nil
}

func EmailExists(db *sql.DB, email string) (bool, error) {
	var exists int
	err := db.QueryRow(`SELECT 1 FROM users WHERE email = ?`, email).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return err == nil, err
}

func NicknameExists(db *sql.DB, nickname string) (bool, error) {
	var exists int
	err := db.QueryRow(`SELECT 1 FROM users WHERE nickname = ?`, nickname).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return err == nil, err
}

func GetUserByEmail(db *sql.DB, email string) (*models.User, error) {
	var u models.User
	err := db.QueryRow(
		`SELECT user_id, email, password, first_name, last_name, dob,
		        avatar, nickname, abt_me, is_public, created_at
		 FROM users WHERE email = ?`,
		email,
	).Scan(&u.UserID, &u.Email, &u.Password, &u.FirstName, &u.LastName, &u.DOB,
		&u.Avatar, &u.Nickname, &u.AboutMe, &u.IsPublic, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func GetUserByNickname(db *sql.DB, nickname string) (*models.User, error) {
	var u models.User
	err := db.QueryRow(
		`SELECT user_id, email, password, first_name, last_name, dob,
		        avatar, nickname, abt_me, is_public, created_at
		 FROM users WHERE nickname = ?`,
		nickname,
	).Scan(&u.UserID, &u.Email, &u.Password, &u.FirstName, &u.LastName, &u.DOB,
		&u.Avatar, &u.Nickname, &u.AboutMe, &u.IsPublic, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func GetUserByID(db *sql.DB, userID string) (*models.User, error) {
	var u models.User
	err := db.QueryRow(
		`SELECT user_id, email, password, first_name, last_name, dob,
		        avatar, nickname, abt_me, is_public, created_at
		 FROM users WHERE user_id = ?`,
		userID,
	).Scan(&u.UserID, &u.Email, &u.Password, &u.FirstName, &u.LastName, &u.DOB,
		&u.Avatar, &u.Nickname, &u.AboutMe, &u.IsPublic, &u.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// users public/private toggle
func SetProfileVisibility(db *sql.DB, userID string, isPublic bool) error {
	_, err := db.Exec(`UPDATE users SET is_public = ? WHERE user_id = ?`, isPublic, userID)
	return err
}

func NicknameExistsForOther(db *sql.DB, nickname string, excludeUserID string) (bool, error) {
	var exists int
	err := db.QueryRow(
		`SELECT 1 FROM users WHERE nickname = ? AND user_id != ?`,
		nickname, excludeUserID,
	).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return err == nil, err
}

func UpdateUserProfile(db *sql.DB, userID string, firstName, lastName string, nickname, aboutMe sql.NullString) error {
	_, err := db.Exec(
		`UPDATE users SET first_name = ?, last_name = ?, nickname = ?, abt_me = ?
		 WHERE user_id = ?`,
		firstName, lastName, nickname, aboutMe, userID,
	)
	return err
}

func UpdateUserAvatar(db *sql.DB, userID string, path string) error {
	_, err := db.Exec(
		`UPDATE users SET avatar = ? WHERE user_id = ?`,
		sql.NullString{String: path, Valid: path != ""}, userID,
	)
	return err
}

func UpdateUserPassword(db *sql.DB, userID string, hashedPassword string) error {
	_, err := db.Exec(`UPDATE users SET password = ? WHERE user_id = ?`, hashedPassword, userID)
	return err
}