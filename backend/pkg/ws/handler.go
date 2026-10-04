package ws

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"

	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

type clientMessage struct {
	Type       string `json:"type"`
	ReceiverID string `json:"receiverId"`
	GroupID    string `json:"groupId"`
}

func UpgradeHandler(hub *Hub, db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("websocket upgrade failed:", err)
			return
		}

		hub.Register(userID, conn)

		for {
			_, raw, err := conn.ReadMessage()
			if err != nil {
				break
			}
			handleClientMessage(db, hub, userID, raw)
		}

		hub.Unregister(userID, conn)
		conn.Close()
	}
}

func handleClientMessage(db *sql.DB, hub *Hub, senderID string, raw []byte) {
	var msg clientMessage
	if err := json.Unmarshal(raw, &msg); err != nil {
		return
	}
	if msg.Type != "typing" {
		return
	}

	if msg.GroupID != "" {
		relayGroupTyping(db, hub, senderID, msg.GroupID)
		return
	}
	if msg.ReceiverID != "" {
		relayDirectTyping(db, hub, senderID, msg.ReceiverID)
	}
}

func relayDirectTyping(db *sql.DB, hub *Hub, senderID, receiverID string) {
	canNotify, err := queries.IsFollowing(db, senderID, receiverID)
	if err != nil {
		return
	}
	if !canNotify {
		canNotify, err = queries.IsFollowing(db, receiverID, senderID)
		if err != nil || !canNotify {
			return
		}
	}

	hub.SendToUser(receiverID, map[string]any{
		"type":     "typing",
		"senderId": senderID,
	})
}

func relayGroupTyping(db *sql.DB, hub *Hub, senderID, groupID string) {
	isMember, err := queries.IsGroupMember(db, groupID, senderID)
	if err != nil || !isMember {
		return
	}

	members, err := queries.ListGroupMembers(db, groupID)
	if err != nil {
		return
	}

	for _, m := range members {
		if m.UserID == senderID {
			continue
		}
		hub.SendToUser(m.UserID, map[string]any{
			"type":     "typing",
			"senderId": senderID,
			"groupId":  groupID,
		})
	}
}