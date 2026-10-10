package follow

import (
	"database/sql"
	"net/http"
	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"
	"social-network-test/pkg/helpers"
	"social-network-test/pkg/models"
	"social-network-test/pkg/notifications"
	"social-network-test/pkg/ws"

	"github.com/google/uuid"
)

func parseID(raw string) (string, error) {
	if _, err := uuid.Parse(raw); err != nil {
		return "", err
	}
	return raw, nil
}

// priv account's data is visible only to its accepted followers
func canViewUserData(db *sql.DB, viewerID, targetID string) (bool, error) {
	if viewerID == targetID {
		return true, nil
	}
	target, err := queries.GetUserByID(db, targetID)
	if err != nil {
		return false, err
	}
	if target.IsPublic {
		return true, nil
	}
	return queries.IsFollowing(db, viewerID, targetID)
}

func GetFollowStatusHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		targetID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid user id"))
			return
		}
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		status, err := queries.GetFollowStatus(db, userID, targetID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": status})
	}
}

func GetFollowersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		targetID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid user id"))
			return
		}
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		canView, err := canViewUserData(db, userID, targetID)
		if err != nil {
			errors.Handle(w, r, errors.NotFound("user not found"))
			return
		}
		if !canView {
			errors.Handle(w, r, errors.Forbidden("this profile is private"))
			return
		}

		users, err := queries.ListFollowers(db, targetID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		count, err := queries.FollowerCount(db, targetID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		response := make([]models.UserPreview, len(users))
		for i, u := range users {
			response[i] = u.Preview()
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{
			"followers": response,
			"count":     count,
		})
	}
}

func GetFollowingHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		targetID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("request is invalid"))
			return
		}
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		canView, err := canViewUserData(db, userID, targetID)
		if err != nil {
			errors.Handle(w, r, errors.NotFound("user not found"))
			return
		}
		if !canView {
			errors.Handle(w, r, errors.Forbidden("this profile is private"))
			return
		}

		users, err := queries.ListFollowing(db, targetID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		count, err := queries.FollowingCount(db, targetID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		response := make([]models.UserPreview, len(users))
		for i, u := range users {
			response[i] = u.Preview()
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{
			"following": response,
			"count":     count,
		})
	}
}

func GetPendingRequestsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		requests, err := queries.ListPendingRequests(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		count, err := queries.PendingRequestCount(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{
			"pending": requests,
			"count":   count,
		})
	}
}

func SendFollowRequestHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		followeeID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid user id"))
			return
		}
		followerID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		if followerID == followeeID {
			errors.Handle(w, r, errors.BadRequest("cannot follow yourself"))
			return
		}

		target, err := queries.GetUserByID(db, followeeID)
		if err != nil {
			errors.Handle(w, r, errors.NotFound("user not found"))
			return
		}

		status := "pending"
		if target.IsPublic {
			status = "accepted"
		}

		created, err := queries.UpsertFollowRequest(db, followerID, followeeID, status)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !created {
			errors.Handle(w, r, errors.Conflict("follow request already exists"))
			return
		}

		followID, idErr := queries.GetFollowID(db, followerID, followeeID)

		if status == "pending" {
			if idErr == nil {
				_ = notifications.Create(db, hub, followeeID, followerID, "follow_request", &followID)
			}
		} else {
			_ = notifications.Create(db, hub, followeeID, followerID, "new_follower", nil)
		}

		response := map[string]any{"status": status}
		if idErr == nil {
			response["requestId"] = followID
		}
		helpers.SendJSON(w, http.StatusCreated, response)
	}
}

func AcceptRequestHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		requestID, err := parseID(r.PathValue("requestId"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid request id"))
			return
		}
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		follow, err := queries.GetFollowByID(db, requestID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("follow request not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if follow.FolloweeID != userID {
			errors.Handle(w, r, errors.Forbidden("not your request to accept"))
			return
		}

		wasPending := follow.Status == "pending"

		if err := queries.UpdateFollowStatus(db, requestID, "accepted"); err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		if wasPending {
			_ = notifications.Create(db, hub, follow.FollowerID, userID, "follow_accepted", &requestID)
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "accepted"})
	}
}

// user B declines user A's request
func DeclineRequestHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		requestID, err := parseID(r.PathValue("requestId"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid request id"))
			return
		}
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		follow, err := queries.GetFollowByID(db, requestID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("follow request not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if follow.FolloweeID != userID {
			errors.Handle(w, r, errors.Forbidden("not your request to decline"))
			return
		}

		if err := queries.UpdateFollowStatus(db, requestID, "declined"); err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "declined"})
	}
}

// user A undoes their request to user B
func CancelRequestHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		requestID, err := parseID(r.PathValue("requestId"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid request id"))
			return
		}
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		follow, err := queries.GetFollowByID(db, requestID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("follow request not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if follow.FollowerID != userID {
			errors.Handle(w, r, errors.Forbidden("not your request to cancel"))
			return
		}

		if err := queries.DeleteFollow(db, requestID); err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "cancelled"})
	}
}

func UnfollowHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		targetID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid user id"))
			return
		}
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		if err := queries.RemoveAcceptedFollow(db, userID, targetID); err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		if hub != nil {
			hub.SendToUser(userID, map[string]string{
				"kind":       "follow",
				"action":     "unfollowed",
				"followeeId": targetID,
			})
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "unfollowed"})
	}
}

func RemoveFollowerHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		followerID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid user id"))
			return
		}

		followeeID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		if err := queries.RemoveAcceptedFollow(db, followerID, followeeID); err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		if hub != nil {
			hub.SendToUser(followerID, map[string]string{
				"kind":       "follow",
				"action":     "unfollowed",
				"followeeId": followeeID,
			})
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{
			"status": "removed",
		})
	}
}