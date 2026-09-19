package errors

import "net/http"

type Error struct {
	Status  int
	Message string
}

func (e *Error) Error() string {
	return e.Message
}

//func new is for any error thats not specified in remaining error funcs
func New(status int, message string) *Error {
	return &Error{Status: status, Message: message}
}

func BadRequest(message string) *Error {
	return &Error{Status: http.StatusBadRequest, Message: message}
}

func Unauthorized(message string) *Error {
	return &Error{Status: http.StatusUnauthorized, Message: message}
}

func Forbidden(message string) *Error {
	return &Error{Status: http.StatusForbidden, Message: message}
}

func NotFound(message string) *Error {
	return &Error{Status: http.StatusNotFound, Message: message}
}

//conflict is when request is valid, but it collides with smthn that already exists
//didnt create a var out of this cuz its usage(& message) depends on situation
func Conflict(message string) *Error {
	return &Error{Status: http.StatusConflict, Message: message}
}

func Internal(message string) *Error {
	return &Error{Status: http.StatusInternalServerError, Message: message}
}

var (
	ErrInvalidBody        = BadRequest("invalid request body")
	ErrUnauthorized       = Unauthorized("unauthorized")
	ErrInvalidCredentials = Unauthorized("Invalid credentials")
	ErrServerError        = Internal("server error")
)
