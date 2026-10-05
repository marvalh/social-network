package ws

import (
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

const writeWait = 5 * time.Second

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
// A connection that fails to accept the write is closed and dropped.
func (h *Hub) SendToUser(userID string, payload any) {
	h.mu.Lock()
	defer h.mu.Unlock()
	for conn := range h.conns[userID] {
		conn.SetWriteDeadline(time.Now().Add(writeWait))
		if err := conn.WriteJSON(payload); err != nil {
			conn.Close()
			delete(h.conns[userID], conn)
		}
	}
	if len(h.conns[userID]) == 0 {
		delete(h.conns, userID)
	}
}

func (h *Hub) SendToUsers(userIDs []string, payload any) {
	for _, userID := range userIDs {
		h.SendToUser(userID, payload)
	}
}

type liveEvent struct {
	Kind  string `json:"kind"`
	Topic string `json:"topic"`
	ID    string `json:"id,omitempty"`
}

// BroadcastLive tells every connected user that data under a topic changed,
// so their open pages can refetch. It carries no data, only the topic.
func (h *Hub) BroadcastLive(topic, id string) {
	payload := liveEvent{Kind: "live", Topic: topic, ID: id}

	h.mu.Lock()
	defer h.mu.Unlock()
	for userID, conns := range h.conns {
		for conn := range conns {
			conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := conn.WriteJSON(payload); err != nil {
				conn.Close()
				delete(conns, conn)
			}
		}
		if len(conns) == 0 {
			delete(h.conns, userID)
		}
	}
}

// LiveTo tells specific users that data under a topic changed.
func (h *Hub) LiveTo(userIDs []string, topic, id string) {
	h.SendToUsers(userIDs, liveEvent{Kind: "live", Topic: topic, ID: id})
}
