package posts

import (
	"database/sql"
	"encoding/json"
	stdErrors "errors"
	"net/http"
	"path/filepath"
	"strconv"

	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"
	"social-network-test/pkg/images"
	"social-network-test/pkg/models"

	"github.com/google/uuid"
)

const (
	defaultLimit = 20
	maxLimit     = 100

	MaxPostContentLength    = 5000
	MaxCommentContentLength = 2000
	PostImageUploadDir = "./private_uploads/posts"
	imagesURLPrefix    = "/api/images/posts/"
)

func parseID(raw string) (string, error) {
	if _, err := uuid.Parse(raw); err != nil {
		return "", err
	}
	return raw, nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeMessage(w http.ResponseWriter, status int, message string) {
	writeJSON(w, status, map[string]string{"message": message})
}

func sanitizePost(p models.Post) models.PostResponse {
	resp := p.Sanitize()
	if resp.Img != "" {
		resp.Img = imagesURLPrefix + resp.Img
	}
	return resp
}

func sanitizeComment(c models.Comment) models.CommentResponse {
	resp := c.Sanitize()
	if resp.Img != "" {
		resp.Img = imagesURLPrefix + resp.Img
	}
	return resp
}

func paginationParams(r *http.Request) (limit, offset int) {
	limit = defaultLimit
	offset = 0
	if v, err := strconv.Atoi(r.URL.Query().Get("limit")); err == nil && v > 0 && v <= maxLimit {
		limit = v
	}
	if v, err := strconv.Atoi(r.URL.Query().Get("offset")); err == nil && v >= 0 {
		offset = v
	}
	return limit, offset
}

func checkCommentAccessible(db *sql.DB, commentID string, viewerID string) error {
	postID, err := queries.GetCommentPostID(db, commentID)
	if err == sql.ErrNoRows {
		return sql.ErrNoRows
	}
	if err != nil {
		return err
	}
	if _, err := queries.GetPostByID(db, postID, viewerID); err != nil {
		return sql.ErrNoRows
	}
	return nil
}

func CreatePostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		var req models.CreatePostRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}
		if req.Content == "" {
			errors.Handle(w, r, errors.BadRequest("content is required"))
			return
		}
		if len(req.Content) > MaxPostContentLength {
			errors.Handle(w, r, errors.BadRequest("content is too long"))
			return
		}

		if req.GroupID != nil {
			isMember, err := queries.IsGroupMember(db, *req.GroupID, userID)
			if err != nil {
				errors.Handle(w, r, errors.ErrServerError)
				return
			}
			if !isMember {
				errors.Handle(w, r, errors.Forbidden("not a member of this group"))
				return
			}
		} else {
			switch req.Privacy {
			case models.PrivacyPublic, models.PrivacyFollowers, models.PrivacyPrivate:
				// ok
			default:
				errors.Handle(w, r, errors.BadRequest("invalid privacy value"))
				return
			}
		}

		if req.Img != "" {
			owned, err := queries.IsImageOwnedBy(db, req.Img, userID)
			if err != nil {
				errors.Handle(w, r, errors.ErrServerError)
				return
			}
			if !owned {
				errors.Handle(w, r, errors.BadRequest("invalid image"))
				return
			}
		}

		// Resolve the visibility recipient list (reads) before opening a transaction.
		var allowed []string
		if req.GroupID == nil && req.Privacy == models.PrivacyPrivate && len(req.VisibleToIDs) > 0 {
			allowed = make([]string, 0, len(req.VisibleToIDs))
			for _, candidate := range req.VisibleToIDs {
				// only actual followers of the poster may be granted access
				isFollower, err := queries.IsFollowing(db, candidate, userID)
				if err == nil && isFollower {
					allowed = append(allowed, candidate)
				}
			}
		}

		tx, err := db.Begin()
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		committed := false
		defer func() {
			if !committed {
				_ = tx.Rollback()
			}
		}()

		postID, err := queries.CreatePost(tx, userID, req)
		if err != nil {
			errors.Handle(w, r, errors.Internal("failed to create post"))
			return
		}
		if len(allowed) > 0 {
			if err := queries.AddPostVisibility(tx, postID, allowed); err != nil {
				errors.Handle(w, r, errors.Internal("failed to set post visibility"))
				return
			}
		}
		if err := tx.Commit(); err != nil {
			errors.Handle(w, r, errors.Internal("failed to create post"))
			return
		}
		committed = true

		post, err := queries.GetPostByID(db, postID, userID)
		if err != nil {
			errors.Handle(w, r, errors.Internal("post created but failed to load"))
			return
		}
		writeJSON(w, http.StatusCreated, sanitizePost(*post))
	}
}

func GetFeedHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		limit, offset := paginationParams(r)
		posts, err := queries.GetFeed(db, userID, limit, offset)
		if err != nil {
			errors.Handle(w, r, errors.Internal("failed to load feed"))
			return
		}

		resp := make([]models.PostResponse, 0, len(posts))
		for i := range posts {
			resp = append(resp, sanitizePost(posts[i]))
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func GetUserPostsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		viewerID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		profileID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid user id"))
			return
		}

		limit, offset := paginationParams(r)
		posts, err := queries.GetUserPosts(db, profileID, viewerID, limit, offset)
		if err != nil {
			errors.Handle(w, r, errors.Internal("failed to load posts"))
			return
		}

		resp := make([]models.PostResponse, 0, len(posts))
		for i := range posts {
			resp = append(resp, sanitizePost(posts[i]))
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func GetGroupPostsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		isMember, err := queries.IsGroupMember(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !isMember {
			errors.Handle(w, r, errors.Forbidden("not a member of this group"))
			return
		}

		limit, offset := paginationParams(r)
		posts, err := queries.GetGroupPosts(db, groupID, userID, limit, offset)
		if err != nil {
			errors.Handle(w, r, errors.Internal("failed to load group posts"))
			return
		}

		resp := make([]models.PostResponse, 0, len(posts))
		for i := range posts {
			resp = append(resp, sanitizePost(posts[i]))
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func GetPostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		postID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid post id"))
			return
		}

		post, err := queries.GetPostByID(db, postID, userID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("post not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		writeJSON(w, http.StatusOK, sanitizePost(*post))
	}
}

func LikePostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		postID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid post id"))
			return
		}

		if _, err := queries.GetPostByID(db, postID, userID); err != nil {
			errors.Handle(w, r, errors.NotFound("post not found"))
			return
		}
		if err := queries.LikePost(db, postID, userID); err != nil {
			errors.Handle(w, r, errors.Internal("failed to like post"))
			return
		}
		writeMessage(w, http.StatusOK, "liked")
	}
}

func UnlikePostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		postID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid post id"))
			return
		}

		if _, err := queries.GetPostByID(db, postID, userID); err != nil {
			errors.Handle(w, r, errors.NotFound("post not found"))
			return
		}
		if err := queries.UnlikePost(db, postID, userID); err != nil {
			errors.Handle(w, r, errors.Internal("failed to unlike post"))
			return
		}
		writeMessage(w, http.StatusOK, "unliked")
	}
}

func CreateCommentHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		postID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid post id"))
			return
		}

		if _, err := queries.GetPostByID(db, postID, userID); err != nil {
			errors.Handle(w, r, errors.NotFound("post not found"))
			return
		}

		var req models.CreateCommentRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}
		if req.Content == "" {
			errors.Handle(w, r, errors.BadRequest("content is required"))
			return
		}
		if len(req.Content) > MaxCommentContentLength {
			errors.Handle(w, r, errors.BadRequest("content is too long"))
			return
		}
		if req.Img != "" {
			owned, err := queries.IsImageOwnedBy(db, req.Img, userID)
			if err != nil {
				errors.Handle(w, r, errors.ErrServerError)
				return
			}
			if !owned {
				errors.Handle(w, r, errors.BadRequest("invalid image"))
				return
			}
		}

		commentID, err := queries.CreateComment(db, postID, userID, req)
		if err != nil {
			errors.Handle(w, r, errors.Internal("failed to create comment"))
			return
		}

		comment, err := queries.GetCommentByID(db, commentID, userID)
		if err != nil {
			writeJSON(w, http.StatusCreated, map[string]string{"commentId": commentID})
			return
		}
		writeJSON(w, http.StatusCreated, sanitizeComment(*comment))
	}
}

func GetCommentsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		postID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid post id"))
			return
		}

		if _, err := queries.GetPostByID(db, postID, userID); err != nil {
			errors.Handle(w, r, errors.NotFound("post not found"))
			return
		}

		limit, offset := paginationParams(r)
		comments, err := queries.GetCommentsForPost(db, postID, userID, limit, offset)
		if err != nil {
			errors.Handle(w, r, errors.Internal("failed to load comments"))
			return
		}

		resp := make([]models.CommentResponse, 0, len(comments))
		for i := range comments {
			resp = append(resp, sanitizeComment(comments[i]))
		}
		writeJSON(w, http.StatusOK, resp)
	}
}

func LikeCommentHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		commentID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid comment id"))
			return
		}

		if err := checkCommentAccessible(db, commentID, userID); err != nil {
			errors.Handle(w, r, errors.NotFound("comment not found"))
			return
		}
		if err := queries.LikeComment(db, commentID, userID); err != nil {
			errors.Handle(w, r, errors.Internal("failed to like comment"))
			return
		}
		writeMessage(w, http.StatusOK, "liked")
	}
}

func UnlikeCommentHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		commentID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid comment id"))
			return
		}

		if err := checkCommentAccessible(db, commentID, userID); err != nil {
			errors.Handle(w, r, errors.NotFound("comment not found"))
			return
		}
		if err := queries.UnlikeComment(db, commentID, userID); err != nil {
			errors.Handle(w, r, errors.Internal("failed to unlike comment"))
			return
		}
		writeMessage(w, http.StatusOK, "unliked")
	}
}

func UpdatePostHandler(db *sql.DB) http.HandlerFunc {  
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		postID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid post id"))
			return
		}

		ownerID, groupID, currentContent, currentImg, currentPrivacy, err := queries.GetPostMeta(db, postID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("post not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if ownerID != userID {
			errors.Handle(w, r, errors.Forbidden("only the author can edit this post"))
			return
		}

		var req models.UpdatePostRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}
		if len(req.Content) > MaxPostContentLength {
			errors.Handle(w, r, errors.BadRequest("content is too long"))
			return
		}

		finalContent := currentContent
		if req.Content != "" {
			finalContent = req.Content
		}

		finalImg := currentImg
		if req.Img != nil {
			finalImg = *req.Img
			if finalImg != "" && finalImg != currentImg {
				owned, err := queries.IsImageOwnedBy(db, finalImg, userID)
				if err != nil {
					errors.Handle(w, r, errors.ErrServerError)
					return
				}
				if !owned {
					errors.Handle(w, r, errors.BadRequest("invalid image"))
					return
				}
			}
		}

		finalPrivacy := currentPrivacy
		if groupID.Valid {
			finalPrivacy = models.PrivacyPublic
		} else if req.Privacy != "" {
			switch req.Privacy {
			case models.PrivacyPublic, models.PrivacyFollowers, models.PrivacyPrivate:
				finalPrivacy = req.Privacy
			default:
				errors.Handle(w, r, errors.BadRequest("invalid privacy value"))
				return
			}
		}

		var allowed []string
		if !groupID.Valid && finalPrivacy == models.PrivacyPrivate && len(req.VisibleToIDs) > 0 {
			allowed = make([]string, 0, len(req.VisibleToIDs))
			for _, candidate := range req.VisibleToIDs {
				isFollower, err := queries.IsFollowing(db, candidate, userID)
				if err == nil && isFollower {
					allowed = append(allowed, candidate)
				}
			}
		}

		tx, err := db.Begin()
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		committed := false
		defer func() {
			if !committed {
				_ = tx.Rollback()
			}
		}()

		if err := queries.UpdatePost(tx, postID, finalContent, finalImg, finalPrivacy); err != nil {
			errors.Handle(w, r, errors.Internal("failed to update post"))
			return
		}
		if !groupID.Valid {
			if err := queries.ClearPostVisibility(tx, postID); err != nil {
				errors.Handle(w, r, errors.Internal("failed to update post visibility"))
				return
			}
			if len(allowed) > 0 {
				if err := queries.AddPostVisibility(tx, postID, allowed); err != nil {
					errors.Handle(w, r, errors.Internal("failed to set post visibility"))
					return
				}
			}
		}
		if err := tx.Commit(); err != nil {
			errors.Handle(w, r, errors.Internal("failed to update post"))
			return
		}
		committed = true

		if currentImg != "" && currentImg != finalImg {
			_ = images.DeletePrevious(PostImageUploadDir, currentImg)
		}

		post, err := queries.GetPostByID(db, postID, userID)
		if err != nil {
			errors.Handle(w, r, errors.Internal("post updated but failed to load"))
			return
		}
		writeJSON(w, http.StatusOK, sanitizePost(*post))
	}
}

func DeletePostHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		postID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid post id"))
			return
		}

		ownerID, _, _, img, _, err := queries.GetPostMeta(db, postID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("post not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if ownerID != userID {
			errors.Handle(w, r, errors.Forbidden("only the author can delete this post"))
			return
		}

		if err := queries.DeletePost(db, postID); err != nil {
			errors.Handle(w, r, errors.Internal("failed to delete post"))
			return
		}
		if img != "" {
			_ = images.DeletePrevious(PostImageUploadDir, img)
		}
		writeMessage(w, http.StatusOK, "post deleted")
	}
}

func UpdateCommentHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		commentID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid comment id"))
			return
		}

		ownerID, currentContent, currentImg, err := queries.GetCommentMeta(db, commentID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("comment not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if ownerID != userID {
			errors.Handle(w, r, errors.Forbidden("only the author can edit this comment"))
			return
		}

		var req models.UpdateCommentRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}
		if len(req.Content) > MaxCommentContentLength {
			errors.Handle(w, r, errors.BadRequest("content is too long"))
			return
		}

		finalContent := currentContent
		if req.Content != "" {
			finalContent = req.Content
		}

		finalImg := currentImg
		if req.Img != nil {
			finalImg = *req.Img
			if finalImg != "" && finalImg != currentImg {
				owned, err := queries.IsImageOwnedBy(db, finalImg, userID)
				if err != nil {
					errors.Handle(w, r, errors.ErrServerError)
					return
				}
				if !owned {
					errors.Handle(w, r, errors.BadRequest("invalid image"))
					return
				}
			}
		}

		if err := queries.UpdateComment(db, commentID, finalContent, finalImg); err != nil {
			errors.Handle(w, r, errors.Internal("failed to update comment"))
			return
		}

		if currentImg != "" && currentImg != finalImg {
			_ = images.DeletePrevious(PostImageUploadDir, currentImg)
		}

		comment, err := queries.GetCommentByID(db, commentID, userID)
		if err != nil {
			errors.Handle(w, r, errors.Internal("comment updated but failed to load"))
			return
		}
		writeJSON(w, http.StatusOK, sanitizeComment(*comment))
	}
}

func DeleteCommentHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		commentID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid comment id"))
			return
		}

		ownerID, _, img, err := queries.GetCommentMeta(db, commentID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("comment not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if ownerID != userID {
			errors.Handle(w, r, errors.Forbidden("only the author can delete this comment"))
			return
		}

		if err := queries.DeleteComment(db, commentID); err != nil {
			errors.Handle(w, r, errors.Internal("failed to delete comment"))
			return
		}
		if img != "" {
			_ = images.DeletePrevious(PostImageUploadDir, img)
		}
		writeMessage(w, http.StatusOK, "comment deleted")
	}
}

func UploadPostImageHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		filename, mimeType, err := images.SaveUpload(w, r, "image", PostImageUploadDir)
		if err != nil {
			status := http.StatusBadRequest
			if stdErrors.Is(err, images.ErrFileTooLarge) {
				status = http.StatusRequestEntityTooLarge
			}
			errors.Handle(w, r, errors.New(status, err.Error()))
			return
		}

		if _, err := queries.CreateImage(db, userID, filename, mimeType); err != nil {
			_ = images.DeletePrevious(PostImageUploadDir, filename)
			errors.Handle(w, r, errors.Internal("failed to record image"))
			return
		}

		writeJSON(w, http.StatusOK, map[string]string{"img": filename})
	}
}

func ServePostImageHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		viewerID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		filename := filepath.Base(r.PathValue("filename"))
		if filename == "" || filename == "." || filename == string(filepath.Separator) {
			errors.Handle(w, r, errors.BadRequest("invalid filename"))
			return
		}

		postID, found, err := queries.FindPostIDByImage(db, filename)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !found {
			errors.Handle(w, r, errors.NotFound("image not found"))
			return
		}
		if _, err := queries.GetPostByID(db, postID, viewerID); err != nil {
			errors.Handle(w, r, errors.NotFound("image not found"))
			return
		}

		http.ServeFile(w, r, filepath.Join(PostImageUploadDir, filename))
	}
}
