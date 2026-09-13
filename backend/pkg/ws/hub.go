package ws

import (
	"sync"

	"github.com/gorilla/websocket"
)

// Hub tracks which users currently have a live websocket connection open.
type Hub struct {
	mu    sync.Mutex
	conns map[string]*websocket.Conn
}

// NewHub creates an empty, ready-to-use Hub.
func NewHub() *Hub {
	return &Hub{
		conns: make(map[string]*websocket.Conn),
	}
}

// Register stores a user's connection when they connect.
func (h *Hub) Register(userID string, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	h.conns[userID] = conn
}

// Unregister removes a user's connection when it dies or closes.
func (h *Hub) Unregister(userID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	delete(h.conns, userID)
}

// SendToUser pushes payload to a user if they're currently connected.
func (h *Hub) SendToUser(userID string, payload any) {
	h.mu.Lock()
	defer h.mu.Unlock()
	conn, exists := h.conns[userID]
	if !exists {
		return
	}
	conn.WriteJSON(payload)
}