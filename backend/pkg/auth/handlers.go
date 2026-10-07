package auth

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"
	"social-network-test/pkg/models"
	"time"
)

func RegisterHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.RegisterRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}

		if err := ValidateRegisterRequest(&req); err != nil {
			errors.Handle(w, r, errors.BadRequest(err.Error()))
			return
		}

		exists, _ := queries.EmailExists(db, req.Email)
		if exists {
			errors.Handle(w, r, errors.ErrConflict)
			return
		}

		hashed, err := HashPassword(req.Password)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		userID, err := queries.CreateUser(db, models.User{
			Email:     req.Email,
			Password:  hashed,
			FirstName: req.FirstName,
			LastName:  req.LastName,
			DOB:       req.DOB,
			Avatar:    sql.NullString{String: req.Avatar, Valid: req.Avatar != ""},
			Nickname:  sql.NullString{String: req.Nickname, Valid: req.Nickname != ""},
			AboutMe:   sql.NullString{String: req.AboutMe, Valid: req.AboutMe != ""},
		})
		if err != nil {
			errors.Handle(w, r, errors.Internal("Failed to create user"))
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]string{"userId": userID})
	}
}

func LoginHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req models.LoginRequest
		json.NewDecoder(r.Body).Decode(&req)

		user, err := queries.GetUserByEmail(db, NormalizeEmail(req.Identifier))
		if err != nil {
			user, err = queries.GetUserByNickname(db, req.Identifier)
		}
		if err != nil || !CheckPassword(user.Password, req.Password) {
			errors.Handle(w, r, errors.ErrInvalidCredentials)
			return
		}

		DeleteUserSessions(db, user.UserID) // enforce one active session
		token, expires, err := CreateSession(db, user.UserID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "session_token",
			Value:    token,
			Expires:  expires,
			HttpOnly: true,
			Path:     "/",
		})
		json.NewEncoder(w).Encode(user.Sanitize())
	}
}

func LogoutHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session_token")
		if err == nil {
			DeleteSession(db, cookie.Value)
		}
		http.SetCookie(w, &http.Cookie{
			Name:    "session_token",
			Value:   "",
			Expires: time.Unix(0, 0),
			Path:    "/",
		})
		w.WriteHeader(http.StatusOK)
	}
}
