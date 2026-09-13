package errors

import (
	"errors"
	"net/http"

	"social-network-test/pkg/helpers"
)

func Handle(w http.ResponseWriter, r *http.Request, err error) {
	var appErr *Error
	if errors.As(err, &appErr) {
		helpers.ErrorHandler(w, r, appErr.Status, appErr.Message)
		return
	}

	helpers.ErrorHandler(w, r, http.StatusInternalServerError, "server error")
}