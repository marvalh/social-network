package auth

import (
	"context"
	"database/sql"
	"net/http"
	"social-network-test/pkg/errors"
)

type contextKey string

const userIDKey contextKey = "userID"

func RequireAuth(db *sql.DB, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		if err != nil {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		userID, err := ValidateSession(db, cookie.Value)
		if err != nil {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// just call this to get id
func GetUserID(r *http.Request) (string, bool) {
	userID, ok := r.Context().Value(userIDKey).(string)
	return userID, ok
}