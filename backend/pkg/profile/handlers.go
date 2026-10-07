package profile

import (
	"database/sql"
	"net/http"
	"strings"

	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"
	"social-network-test/pkg/helpers"
	"social-network-test/pkg/models"

	"github.com/google/uuid"
)

func parseID(raw string) (string, error) {
	if _, err := uuid.Parse(raw); err != nil {
		return "", err
	}
	return raw, nil
}

func GetProfileHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		viewerID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		targetID, err := resolveTargetID(r, viewerID)
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid user id"))
			return
		}

		target, err := queries.GetUserByID(db, targetID)
		if err != nil {
			errors.Handle(w, r, errors.NotFound("user not found"))
			return
		}

		isOwner := viewerID == targetID

		followStatus, err := queries.GetFollowStatus(db, viewerID, targetID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		isFollowing := followStatus == "accepted"

		var followRequestID *string
		if followStatus == "pending" {
			if id, err := queries.GetFollowID(db, viewerID, targetID); err == nil {
				followRequestID = &id
			}
		}

		canView := isOwner || target.IsPublic || isFollowing

		resp := models.ProfileResponse{
			IsOwner:         isOwner,
			CanView:         canView,
			FollowStatus:    followStatus,
			FollowRequestID: followRequestID,
			IsFollowing:     isFollowing,
		}

		if !canView {
			// Minimal preview only: no counts, followers/following, or posts.
			minimal := target.Sanitize()
			minimal.Email = ""
			minimal.DOB = ""
			minimal.AboutMe = ""
			resp.User = minimal
			helpers.SendJSON(w, http.StatusOK, map[string]any{"profile": resp})
			return
		}

		followerCount, err := queries.FollowerCount(db, targetID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		followingCount, err := queries.FollowingCount(db, targetID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		followers, err := queries.ListFollowers(db, targetID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		following, err := queries.ListFollowing(db, targetID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		posts, err := queries.ListProfilePosts(db, targetID, viewerID, isOwner, isFollowing)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

				for i := range posts {
			if posts[i].Img != "" {
				posts[i].Img = "/api/images/posts/" + posts[i].Img
			}
		}

		resp.User = target.Sanitize()
		resp.FollowerCount = followerCount
		resp.FollowingCount = followingCount
		resp.Followers = sanitizeAll(followers)
		resp.Following = sanitizeAll(following)
		resp.Posts = posts

		helpers.SendJSON(w, http.StatusOK, map[string]any{"profile": resp})
	}
}

func resolveTargetID(r *http.Request, viewerID string) (string, error) {
	idParam := r.PathValue("id")
	if idParam == "" || idParam == "me" {
		return viewerID, nil
	}
	return parseID(idParam)
}

func SearchUsersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		viewerID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		query := strings.TrimSpace(r.URL.Query().Get("q"))
		if query == "" {
			helpers.SendJSON(w, http.StatusOK, map[string]any{"users": []models.UserPreview{}})
			return
		}

		users, err := queries.SearchUsers(db, query, viewerID, 10)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		results := make([]models.UserPreview, 0, len(users))
		for _, u := range users {
			results = append(results, u.Preview())
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"users": results})
	}
}

func SuggestedUsersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		users, err := queries.SuggestedUsers(db, userID, 10)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		results := make([]models.UserPreview, 0, len(users))
		for _, u := range users {
			results = append(results, u.Preview())
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"users": results})
	}
}

func sanitizeAll(users []models.User) []models.UserPreview {
	out := make([]models.UserPreview, 0, len(users))
	for _, u := range users {
		out = append(out, u.Preview())
	}
	return out
}
