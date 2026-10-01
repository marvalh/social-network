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
	if msg.Type != "typing" || msg.ReceiverID == "" {
		return
	}

	canNotify, err := queries.IsFollowing(db, senderID, msg.ReceiverID)
	if err != nil {
		return
	}
	if !canNotify {
		canNotify, err = queries.IsFollowing(db, msg.ReceiverID, senderID)
		if err != nil || !canNotify {
			return
		}
	}

	hub.SendToUser(msg.ReceiverID, map[string]any{
		"type":     "typing",
		"senderId": senderID,
	})
}
