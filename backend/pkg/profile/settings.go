package profile

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"

	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"
	"social-network-test/pkg/helpers"
	"social-network-test/pkg/models"
)

func UpdateProfileHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		var req models.UpdateProfileRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}

		current, err := queries.GetUserByID(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.NotFound("user not found"))
			return
		}

		firstName := current.FirstName
		lastName := current.LastName
		nickname := current.Nickname.String
		aboutMe := current.AboutMe.String

		if req.FirstName != nil {
			firstName = strings.TrimSpace(*req.FirstName)
			if len(firstName) < 1 || len(firstName) > 50 {
				errors.Handle(w, r, errors.BadRequest("first name must be between 1 and 50 characters"))
				return
			}
		}
		if req.LastName != nil {
			lastName = strings.TrimSpace(*req.LastName)
			if len(lastName) < 1 || len(lastName) > 50 {
				errors.Handle(w, r, errors.BadRequest("last name must be between 1 and 50 characters"))
				return
			}
		}
		if req.Nickname != nil {
			nickname = strings.TrimSpace(*req.Nickname)
			if err := auth.ValidateNickname(nickname); err != nil {
				errors.Handle(w, r, errors.BadRequest(err.Error()))
				return
			}
			if nickname != "" {
				taken, err := queries.NicknameExistsForOther(db, nickname, userID)
				if err != nil {
					errors.Handle(w, r, errors.ErrServerError)
					return
				}
				if taken {
					errors.Handle(w, r, errors.Conflict("nickname already taken"))
					return
				}
			}
		}
		if req.AboutMe != nil {
			aboutMe = strings.TrimSpace(*req.AboutMe)
			if err := auth.ValidateAboutMe(aboutMe); err != nil {
				errors.Handle(w, r, errors.BadRequest(err.Error()))
				return
			}
		}

		err = queries.UpdateUserProfile(db, userID, firstName, lastName,
			sql.NullString{String: nickname, Valid: nickname != ""},
			sql.NullString{String: aboutMe, Valid: aboutMe != ""},
		)
		if err != nil {
			errors.Handle(w, r, errors.Internal("failed to update profile"))
			return
		}

		updated, err := queries.GetUserByID(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		helpers.SendJSON(w, http.StatusOK, map[string]any{"user": updated.Sanitize()})
	}
}

func UpdateVisibilityHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		var req models.UpdateVisibilityRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}

		if err := queries.SetProfileVisibility(db, userID, req.IsPublic); err != nil {
			errors.Handle(w, r, errors.Internal("failed to update visibility"))
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"isPublic": req.IsPublic})
	}
}

func UpdatePasswordHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		var req models.UpdatePasswordRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}

		if appErr := validatePasswordChange(db, userID, req); appErr != nil {
			errors.Handle(w, r, appErr)
			return
		}

		hashed, err := auth.HashPassword(req.NewPassword)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if err := queries.UpdateUserPassword(db, userID, hashed); err != nil {
			errors.Handle(w, r, errors.Internal("failed to update password"))
			return
		}

		_ = auth.DeleteUserSessions(db, userID)

		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "password updated"})
	}
}

func validatePasswordChange(db *sql.DB, userID string, req models.UpdatePasswordRequest) *errors.Error {
	current, err := queries.GetUserByID(db, userID)
	if err != nil {
		return errors.NotFound("user not found")
	}
	if !auth.CheckPassword(current.Password, req.CurrentPassword) {
		return errors.BadRequest("current password is incorrect")
	}
	if err := auth.ValidatePasswordStrength(req.NewPassword); err != nil {
		return errors.BadRequest(err.Error())
	}
	return nil
}