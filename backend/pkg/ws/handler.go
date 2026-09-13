package ws

import (
	"log"
	"net/http"
	"social-network-test/pkg/auth"
	"social-network-test/pkg/errors"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func UpgradeHandler(hub *Hub) http.HandlerFunc {
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
			_, _, err = conn.ReadMessage()
			if err != nil {
				break
			}
		}

		hub.Unregister(userID)

		conn.Close()
	}
}
