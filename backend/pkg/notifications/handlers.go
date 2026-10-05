package notifications

import (
	"database/sql"
	"net/http"

	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"
	"social-network-test/pkg/helpers"
	"social-network-test/pkg/ws"

	"github.com/google/uuid"
)

func parseID(raw string) (string, error) {
	if _, err := uuid.Parse(raw); err != nil {
		return "", err
	}
	return raw, nil
}

func ListNotificationsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		notifications, err := queries.ListNotifications(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		count, err := queries.UnreadCount(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{
			"notifications": notifications,
			"unreadCount":   count,
		})
	}
}

func MarkReadHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		notifID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid notification id"))
			return
		}
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		if err := queries.MarkRead(db, notifID, userID); err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "read"})
	}
}

// Types that notify only once per person and target, so liking and unliking
// over and over cannot spam someone.
var oncePerActor = map[string]bool{
	"post_like":    true,
	"comment_like": true,
	"new_follower": true,
}

// Create saves a notification and pushes it live if the user is connected.
// actorID is who triggered it. Notifying yourself about your own action is skipped.
func Create(db *sql.DB, hub *ws.Hub, userID, actorID, notifType string, referenceID *string) error {
	if actorID != "" && actorID == userID {
		return nil
	}

	if oncePerActor[notifType] {
		exists, err := queries.NotificationExists(db, userID, actorID, notifType, referenceID)
		if err == nil && exists {
			return nil
		}
	}

	notifID, err := queries.InsertNotification(db, userID, actorID, notifType, referenceID)
	if err != nil {
		return err
	}

	notification, err := queries.GetNotification(db, notifID)
	if err != nil {
		return err
	}

	hub.SendToUser(userID, notification)
	return nil
}

func MarkAllReadHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		if err := queries.MarkAllRead(db, userID); err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		hub.LiveTo([]string{userID}, "notifications", "")
		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "read"})
	}
}
