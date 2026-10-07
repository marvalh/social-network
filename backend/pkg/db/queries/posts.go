package queries

import (
	"database/sql"

	"social-network-test/pkg/models"

	"github.com/google/uuid"
)

type DBTX interface {
	Exec(query string, args ...any) (sql.Result, error)
	Query(query string, args ...any) (*sql.Rows, error)
	QueryRow(query string, args ...any) *sql.Row
}

const selectPostColumns = `
	SELECT
		p.post_id, p.user_id, p.group_id, p.content, p.img, p.privacy, p.created_at,
		u.first_name, u.last_name, u.avatar,
		(SELECT COUNT(*) FROM post_likes pl WHERE pl.post_id = p.post_id) AS like_count,
		(SELECT COUNT(*) FROM comments c WHERE c.post_id = p.post_id) AS comment_count,
		EXISTS(SELECT 1 FROM post_likes pl2 WHERE pl2.post_id = p.post_id AND pl2.user_id = ?) AS liked_by_viewer
	FROM posts p
	JOIN users u ON u.user_id = p.user_id
`

func scanPost(row *sql.Rows) (models.Post, error) {
	var p models.Post
	err := row.Scan(
		&p.PostID, &p.UserID, &p.GroupID, &p.Content, &p.Img, &p.Privacy, &p.CreatedAt,
		&p.AuthorFirstName, &p.AuthorLastName, &p.AuthorAvatar,
		&p.LikeCount, &p.CommentCount, &p.LikedByViewer,
	)
	return p, err
}

func CreatePost(db DBTX, userID string, req models.CreatePostRequest) (string, error) {
	privacy := req.Privacy
	if req.GroupID != nil {
		privacy = models.PrivacyPublic
	}

	var groupID sql.NullString
	if req.GroupID != nil {
		groupID = sql.NullString{String: *req.GroupID, Valid: true}
	}

	postID := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO posts (post_id, user_id, group_id, content, img, privacy) VALUES (?, ?, ?, ?, ?, ?)`,
		postID, userID, groupID, req.Content, sql.NullString{String: req.Img, Valid: req.Img != ""}, privacy,
	)
	if err != nil {
		return "", err
	}
	return postID, nil
}

func AddPostVisibility(db DBTX, postID string, userIDs []string) error {
	for _, uid := range userIDs {
		if _, err := db.Exec(`INSERT OR IGNORE INTO post_visible_to (post_id, user_id) VALUES (?, ?)`, postID, uid); err != nil {
			return err
		}
	}
	return nil
}

func ListPostAudience(db *sql.DB, postID string) ([]string, error) {
	var ownerID string
	var groupID sql.NullString
	var privacy string
	if err := db.QueryRow(
		`SELECT user_id, group_id, privacy FROM posts WHERE post_id = ?`, postID,
	).Scan(&ownerID, &groupID, &privacy); err != nil {
		return nil, err
	}

	query := `SELECT user_id FROM users`
	args := []any{}
	switch {
	case groupID.Valid:
		query = `SELECT members_id FROM group_members WHERE group_id = ?`
		args = append(args, groupID.String)
	case privacy == models.PrivacyFollowers:
		query = `SELECT follower_id FROM follows WHERE followee_id = ? AND status = 'accepted'`
		args = append(args, ownerID)
	case privacy == models.PrivacyPrivate:
		query = `SELECT v.user_id FROM post_visible_to v
		         JOIN follows f ON f.follower_id = v.user_id
		         AND f.followee_id = ? AND f.status = 'accepted'
		         WHERE v.post_id = ?`
		args = append(args, ownerID, postID)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	audience := []string{ownerID}
	seen := map[string]bool{ownerID: true}
	for rows.Next() {
		var userID string
		if err := rows.Scan(&userID); err != nil {
			return nil, err
		}
		if !seen[userID] {
			audience = append(audience, userID)
			seen[userID] = true
		}
	}
	return audience, rows.Err()
}

func CanViewPost(db *sql.DB, viewerID string, p *models.Post) (bool, error) {
	if p.UserID == viewerID {
		return true, nil
	}
	if p.GroupID.Valid {
		return IsGroupMember(db, p.GroupID.String, viewerID)
	}
	switch p.Privacy {
	case models.PrivacyPublic:
		return true, nil
	case models.PrivacyFollowers:
		return IsFollowing(db, viewerID, p.UserID)
	case models.PrivacyPrivate:
		following, err := IsFollowing(db, viewerID, p.UserID)
		if err != nil || !following {
			return false, err
		}
		var exists int
		err = db.QueryRow(
			`SELECT 1 FROM post_visible_to WHERE post_id = ? AND user_id = ?`,
			p.PostID, viewerID,
		).Scan(&exists)
		if err == sql.ErrNoRows {
			return false, nil
		}
		return err == nil, err
	default:
		return false, nil
	}
}

func GetPostByID(db *sql.DB, postID, viewerID string) (*models.Post, error) {
	rows, err := db.Query(selectPostColumns+` WHERE p.post_id = ?`, viewerID, postID)
	if err != nil {
		return nil, err
	}

	if !rows.Next() {
		rows.Close()
		return nil, sql.ErrNoRows
	}
	p, err := scanPost(rows)
	rows.Close()
	if err != nil {
		return nil, err
	}

	ok, err := CanViewPost(db, viewerID, &p)
	if err != nil {
		return nil, err
	}
	if !ok {
		return nil, sql.ErrNoRows
	}
	return &p, nil
}

func GetFeed(db *sql.DB, viewerID string, limit, offset int) ([]models.Post, error) {
	query := selectPostColumns + `
		WHERE p.group_id IS NULL
		AND (
			p.user_id = ?
			OR (
				p.user_id IN (
					SELECT followee_id FROM follows WHERE follower_id = ? AND status = 'accepted'
				)
				AND (
					p.privacy = 'public'
					OR p.privacy = 'followers'
					OR (p.privacy = 'private' AND p.post_id IN (
						SELECT post_id FROM post_visible_to WHERE user_id = ?
					))
				)
			)
		)
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := db.Query(query, viewerID, viewerID, viewerID, viewerID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		p, err := scanPost(rows)
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

func GetUserPosts(db *sql.DB, profileUserID, viewerID string, limit, offset int) ([]models.Post, error) {
	query := selectPostColumns + `
		WHERE p.group_id IS NULL AND p.user_id = ?
		AND (
			p.user_id = ?
			OR p.privacy = 'public'
			OR (p.privacy = 'followers' AND p.user_id IN (
				SELECT followee_id FROM follows WHERE follower_id = ? AND status = 'accepted'
			))
			OR (p.privacy = 'private'
				AND p.user_id IN (
					SELECT followee_id FROM follows WHERE follower_id = ? AND status = 'accepted'
				)
				AND p.post_id IN (
					SELECT post_id FROM post_visible_to WHERE user_id = ?
				))
		)
		ORDER BY p.created_at DESC
		LIMIT ? OFFSET ?
	`
	rows, err := db.Query(query, viewerID, profileUserID, viewerID, viewerID, viewerID, viewerID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		p, err := scanPost(rows)
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

func GetGroupPosts(db *sql.DB, groupID, viewerID string, limit, offset int) ([]models.Post, error) {
	query := selectPostColumns + ` WHERE p.group_id = ? ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
	rows, err := db.Query(query, viewerID, groupID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []models.Post
	for rows.Next() {
		p, err := scanPost(rows)
		if err != nil {
			return nil, err
		}
		posts = append(posts, p)
	}
	return posts, rows.Err()
}

func LikePost(db *sql.DB, postID, userID string) error {
	_, err := db.Exec(`INSERT OR IGNORE INTO post_likes (post_id, user_id) VALUES (?, ?)`, postID, userID)
	return err
}

func UnlikePost(db *sql.DB, postID, userID string) error {
	_, err := db.Exec(`DELETE FROM post_likes WHERE post_id = ? AND user_id = ?`, postID, userID)
	return err
}

const selectCommentColumns = `
	SELECT
		c.comment_id, c.post_id, c.user_id, c.content, c.img, c.created_at,
		u.first_name, u.last_name, u.avatar,
		(SELECT COUNT(*) FROM comment_likes cl WHERE cl.comment_id = c.comment_id) AS like_count,
		EXISTS(SELECT 1 FROM comment_likes cl2 WHERE cl2.comment_id = c.comment_id AND cl2.user_id = ?) AS liked_by_viewer
	FROM comments c
	JOIN users u ON u.user_id = c.user_id
`

func scanComment(row *sql.Rows) (models.Comment, error) {
	var c models.Comment
	err := row.Scan(
		&c.CommentID, &c.PostID, &c.UserID, &c.Content, &c.Img, &c.CreatedAt,
		&c.AuthorFirstName, &c.AuthorLastName, &c.AuthorAvatar,
		&c.LikeCount, &c.LikedByViewer,
	)
	return c, err
}

func CreateComment(db DBTX, postID, userID string, req models.CreateCommentRequest) (string, error) {
	commentID := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO comments (comment_id, post_id, user_id, content, img) VALUES (?, ?, ?, ?, ?)`,
		commentID, postID, userID, req.Content, sql.NullString{String: req.Img, Valid: req.Img != ""},
	)
	if err != nil {
		return "", err
	}
	return commentID, nil
}

func GetCommentByID(db *sql.DB, commentID, viewerID string) (*models.Comment, error) {
	rows, err := db.Query(selectCommentColumns+` WHERE c.comment_id = ?`, viewerID, commentID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	if !rows.Next() {
		return nil, sql.ErrNoRows
	}
	c, err := scanComment(rows)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func GetCommentsForPost(db *sql.DB, postID, viewerID string, limit, offset int) ([]models.Comment, error) {
	query := selectCommentColumns + ` WHERE c.post_id = ? ORDER BY c.created_at ASC LIMIT ? OFFSET ?`
	rows, err := db.Query(query, viewerID, postID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		c, err := scanComment(rows)
		if err != nil {
			return nil, err
		}
		comments = append(comments, c)
	}
	return comments, rows.Err()
}

func GetCommentPostID(db *sql.DB, commentID string) (postID string, err error) {
	err = db.QueryRow(`SELECT post_id FROM comments WHERE comment_id = ?`, commentID).Scan(&postID)
	return postID, err
}

func LikeComment(db *sql.DB, commentID, userID string) error {
	_, err := db.Exec(`INSERT OR IGNORE INTO comment_likes (comment_id, user_id) VALUES (?, ?)`, commentID, userID)
	return err
}

func UnlikeComment(db *sql.DB, commentID, userID string) error {
	_, err := db.Exec(`DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?`, commentID, userID)
	return err
}

func GetPostMeta(db *sql.DB, postID string) (userID string, groupID sql.NullString, content, img, privacy string, err error) {
	var imgNull sql.NullString
	err = db.QueryRow(
		`SELECT user_id, group_id, content, img, privacy FROM posts WHERE post_id = ?`,
		postID,
	).Scan(&userID, &groupID, &content, &imgNull, &privacy)
	return userID, groupID, content, imgNull.String, privacy, err
}

func GetCommentMeta(db *sql.DB, commentID string) (userID string, content, img string, err error) {
	var imgNull sql.NullString
	err = db.QueryRow(
		`SELECT user_id, content, img FROM comments WHERE comment_id = ?`,
		commentID,
	).Scan(&userID, &content, &imgNull)
	return userID, content, imgNull.String, err
}

func UpdatePost(db DBTX, postID string, content, img, privacy string) error {
	_, err := db.Exec(
		`UPDATE posts SET content = ?, img = ?, privacy = ? WHERE post_id = ?`,
		content, sql.NullString{String: img, Valid: img != ""}, privacy, postID,
	)
	return err
}

func ClearPostVisibility(db DBTX, postID string) error {
	_, err := db.Exec(`DELETE FROM post_visible_to WHERE post_id = ?`, postID)
	return err
}

func DeletePost(db DBTX, postID string) error {
	_, err := db.Exec(`DELETE FROM posts WHERE post_id = ?`, postID)
	return err
}

func UpdateComment(db DBTX, commentID string, content, img string) error {
	_, err := db.Exec(
		`UPDATE comments SET content = ?, img = ? WHERE comment_id = ?`,
		content, sql.NullString{String: img, Valid: img != ""}, commentID,
	)
	return err
}

func DeleteComment(db DBTX, commentID string) error {
	_, err := db.Exec(`DELETE FROM comments WHERE comment_id = ?`, commentID)
	return err
}

func IsImageOwnedBy(db *sql.DB, path string, userID string) (bool, error) {
	var exists int
	err := db.QueryRow(`SELECT 1 FROM images WHERE path = ? AND owner_id = ?`, path, userID).Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return err == nil, err
}

func FindPostIDByImage(db *sql.DB, filename string) (postID string, found bool, err error) {
	err = db.QueryRow(`SELECT post_id FROM posts WHERE img = ?`, filename).Scan(&postID)
	if err == nil {
		return postID, true, nil
	}
	if err != sql.ErrNoRows {
		return "", false, err
	}

	err = db.QueryRow(`SELECT post_id FROM comments WHERE img = ?`, filename).Scan(&postID)
	if err == nil {
		return postID, true, nil
	}
	if err == sql.ErrNoRows {
		return "", false, nil
	}
	return "", false, err
}
