package queries

import (
	"database/sql"

	"github.com/google/uuid"
)

func CreateImage(db *sql.DB, ownerID, path, mimeType string) (string, error) {
	imgID := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO images (img_id, owner_id, path, mime_type) VALUES (?, ?, ?, ?)`,
		imgID, ownerID, path, mimeType,
	)
	if err != nil {
		return "", err
	}
	return imgID, nil
}

func GetImageOwnerByPath(db *sql.DB, path string) (string, error) {
	var ownerID string
	err := db.QueryRow(`SELECT owner_id FROM images WHERE path = ?`, path).Scan(&ownerID)
	return ownerID, err
}
