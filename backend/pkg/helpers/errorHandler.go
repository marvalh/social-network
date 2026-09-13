package helpers

import (
	"net/http"
)

func ErrorHandler(w http.ResponseWriter, r *http.Request, statusCode int, message string) {
	SendJSON(w, statusCode, message)
}
