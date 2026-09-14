package profile

import (
	"database/sql"
	stderrors "errors"
	"net/http"
	"path/filepath"

	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"
	"social-network-test/pkg/helpers"
	"social-network-test/pkg/images"
)

const AvatarUploadDir = "./uploads/avatars"

const avatarURLPrefix = "/uploads/avatars/"

func UploadAvatarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		current, err := queries.GetUserByID(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.NotFound("user not found"))
			return
		}

		filename, mimeType, err := images.SaveUpload(w, r, "avatar", AvatarUploadDir)
		if err != nil {
			if stderrors.Is(err, images.ErrFileTooLarge) {
				errors.Handle(w, r, errors.New(http.StatusRequestEntityTooLarge, err.Error()))
				return
			}
			errors.Handle(w, r, errors.BadRequest(err.Error()))
			return
		}

		relPath := avatarURLPrefix + filename

		if _, err := queries.CreateImage(db, userID, relPath, mimeType); err != nil {
			_ = images.DeletePrevious(AvatarUploadDir, filename)
			errors.Handle(w, r, errors.Internal("failed to record image"))
			return
		}

		if err := queries.UpdateUserAvatar(db, userID, relPath); err != nil {
			errors.Handle(w, r, errors.Internal("failed to update avatar"))
			return
		}

		// Best-effort: remove the old avatar file now that the new one is live.
		// Not fatal if it fails (e.g. already gone) — the new avatar is already
		// saved and applied.
		if oldFilename := avatarFilenameFromPath(current.Avatar.String); oldFilename != "" {
			_ = images.DeletePrevious(AvatarUploadDir, oldFilename)
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"avatar": relPath})
	}
}

func RemoveAvatarHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		current, err := queries.GetUserByID(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.NotFound("user not found"))
			return
		}

		if err := queries.UpdateUserAvatar(db, userID, ""); err != nil {
			errors.Handle(w, r, errors.Internal("failed to update avatar"))
			return
		}

		if oldFilename := avatarFilenameFromPath(current.Avatar.String); oldFilename != "" {
			_ = images.DeletePrevious(AvatarUploadDir, oldFilename)
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "avatar removed"})
	}
}

func avatarFilenameFromPath(path string) string {
	if len(path) <= len(avatarURLPrefix) || path[:len(avatarURLPrefix)] != avatarURLPrefix {
		return ""
	}
	return path[len(avatarURLPrefix):]
}

func ServeAvatarHandler(db *sql.DB) http.HandlerFunc {
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

		ownerID, err := queries.GetImageOwnerByPath(db, avatarURLPrefix+filename)
		if err != nil {
			errors.Handle(w, r, errors.NotFound("avatar not found"))
			return
		}

		if ownerID != viewerID {
			owner, err := queries.GetUserByID(db, ownerID)
			if err != nil {
				errors.Handle(w, r, errors.NotFound("avatar not found"))
				return
			}
			if !owner.IsPublic {
				following, err := queries.IsFollowing(db, viewerID, ownerID)
				if err != nil {
					errors.Handle(w, r, errors.ErrServerError)
					return
				}
				if !following {
					errors.Handle(w, r, errors.Forbidden("this profile is private"))
					return
				}
			}
		}

		http.ServeFile(w, r, filepath.Join(AvatarUploadDir, filename))
	}
}
