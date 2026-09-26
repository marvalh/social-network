package ws

import (
	"sync"

	"github.com/gorilla/websocket"
)

// Hub tracks every live websocket connection a user currently has open.
// A user can have more than one at once (multiple tabs or devices).
type Hub struct {
	mu    sync.Mutex
	conns map[string]map[*websocket.Conn]bool
}

// NewHub creates an empty, ready-to-use Hub.
func NewHub() *Hub {
	return &Hub{
		conns: make(map[string]map[*websocket.Conn]bool),
	}
}

// Register stores a user's connection when they connect.
func (h *Hub) Register(userID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if h.conns[userID] == nil {
		h.conns[userID] = make(map[*websocket.Conn]bool)
	}
	h.conns[userID][conn] = true
}

// Unregister removes one specific connection when it dies or closes.
// Other connections the same user has open (other tabs/devices) are untouched.
func (h *Hub) Unregister(userID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.conns[userID], conn)
	if len(h.conns[userID]) == 0 {
		delete(h.conns, userID)
	}
}

// SendToUser pushes payload to every connection a user currently has open.
func (h *Hub) SendToUser(userID string, payload any) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for conn := range h.conns[userID] {
		conn.WriteJSON(payload)
	}
}

func (h *Hub) SendToUsers(userIDs []string, payload any) {
	for _, userID := range userIDs {
		h.SendToUser(userID, payload)
	}
}
