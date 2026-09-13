package chat

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"
	"social-network-test/pkg/helpers"
	"social-network-test/pkg/models"
	"social-network-test/pkg/ws"

	"github.com/google/uuid"
)

func parseID(raw string) (string, error) {
	if _, err := uuid.Parse(raw); err != nil {
		return "", err
	}
	return raw, nil
}

func SendMessageHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		receiverID, err := parseID(r.PathValue("userId"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid user id"))
			return
		}
		senderID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		if senderID == receiverID {
			errors.Handle(w, r, errors.BadRequest("cannot message yourself"))
			return
		}

		var req models.SendMessageRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}
		if req.Content == "" {
			errors.Handle(w, r, errors.BadRequest("message content required"))
			return
		}

		allowed, err := canMessage(db, senderID, receiverID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !allowed {
			errors.Handle(w, r, errors.Forbidden("you must follow or be followed by this user to message them"))
			return
		}

		chatID, err := queries.InsertMessage(db, senderID, receiverID, req.Content)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		message := models.Message{
			ChatID:     chatID,
			SenderID:   senderID,
			ReceiverID: receiverID,
			Content:    req.Content,
		}
		hub.SendToUser(receiverID, message)

		helpers.SendJSON(w, http.StatusCreated, map[string]any{"chatId": chatID})
	}
}

func GetConversationHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		otherID, err := parseID(r.PathValue("userId"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid user id"))
			return
		}
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		messages, err := queries.ListConversation(db, userID, otherID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"messages": messages})
	}
}

func SendGroupMessageHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		groupID, err := parseID(r.PathValue("groupId"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}
		senderID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		isMember, err := queries.IsGroupMember(db, groupID, senderID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !isMember {
			errors.Handle(w, r, errors.Forbidden("not a member of this group"))
			return
		}

		var req models.SendMessageRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}
		if req.Content == "" {
			errors.Handle(w, r, errors.BadRequest("message content required"))
			return
		}

		chatID, err := queries.InsertGroupMessage(db, groupID, senderID, req.Content)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusCreated, map[string]any{"chatId": chatID})
	}
}

func GetGroupMessagesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		groupID, err := parseID(r.PathValue("groupId"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		isMember, err := queries.IsGroupMember(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !isMember {
			errors.Handle(w, r, errors.Forbidden("not a member of this group"))
			return
		}

		messages, err := queries.ListGroupMessages(db, groupID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"messages": messages})
	}
}
