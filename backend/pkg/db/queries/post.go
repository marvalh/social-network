package queries

import (
	"database/sql"

	"social-network-test/pkg/models"
)

func ListProfilePosts(db *sql.DB, ownerID, viewerID string, isOwner, viewerFollowsOwner bool) ([]models.PostSummary, error) {
	rows, err := db.Query(
		`SELECT post_id, content, img, privacy, created_at
		 FROM posts
		 WHERE user_id = ? AND group_id IS NULL
		   AND (
		        ?
		        OR privacy = 'public'
		        OR (privacy = 'followers' AND ?)
		        OR (privacy = 'private' AND ? AND post_id IN (
		              SELECT post_id FROM post_visible_to WHERE user_id = ?
		        ))
		   )
		 ORDER BY created_at DESC`,
		ownerID, isOwner, viewerFollowsOwner, viewerFollowsOwner, viewerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	posts := []models.PostSummary{}
	for rows.Next() {
		var p models.PostSummary
		var img sql.NullString
		if err := rows.Scan(&p.PostID, &p.Content, &img, &p.Privacy, &p.CreatedAt); err != nil {
			return nil, err
		}
		p.Img = img.String
		posts = append(posts, p)
	}
	return posts, rows.Err()
}
