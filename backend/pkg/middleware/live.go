package middleware

import (
	"net/http"
	"strings"

	"social-network-test/pkg/ws"

	"github.com/google/uuid"
)

var liveRoutes = []struct {
	prefix string
	topic  string
}{
	{"/api/follow-requests", "follow"},
	{"/api/followers", "follow"},
	{"/api/users/", "follow"},
	{"/api/profile/me", "profile"},
	{"/api/groups", "groups"},
	{"/api/invites", "groups"},
	{"/api/events", "groups"},
}

type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (s *statusRecorder) WriteHeader(code int) {
	s.status = code
	s.ResponseWriter.WriteHeader(code)
}

// Live tells every connected browser that data changed after a successful
// write request, so open pages can refetch. The event carries no data, only a
// topic, plus a group id when the request was about one group.
func Live(hub *ws.Hub, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		topic := liveTopic(r)
		if topic == "" {
			next.ServeHTTP(w, r)
			return
		}

		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)

		if rec.status < 400 {
			hub.BroadcastLive(topic, liveID(r))
		}
	})
}

func liveTopic(r *http.Request) string {
	switch r.Method {
	case http.MethodPost, http.MethodPatch, http.MethodPut, http.MethodDelete:
	default:
		return ""
	}
	for _, route := range liveRoutes {
		if strings.HasPrefix(r.URL.Path, route.prefix) {
			return route.topic
		}
	}
	return ""
}

func liveID(r *http.Request) string {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) > 3 && parts[2] == "groups" {
		if _, err := uuid.Parse(parts[3]); err == nil {
			return parts[3]
		}
	}
	return ""
}