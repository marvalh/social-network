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