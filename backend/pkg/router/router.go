package router

import (
	"database/sql"
	"net/http"
	"social-network-test/pkg/auth"
	"social-network-test/pkg/chat"
	"social-network-test/pkg/follow"
	"social-network-test/pkg/groups"
	"social-network-test/pkg/notifications"
	"social-network-test/pkg/posts"
	"social-network-test/pkg/profile"
	"social-network-test/pkg/ws"
)

func RegisterRoutes(mux *http.ServeMux, db *sql.DB, hub *ws.Hub) {
	mux.HandleFunc("/api/register", auth.RegisterHandler(db))
	mux.HandleFunc("/api/login", auth.LoginHandler(db))
	mux.HandleFunc("/api/logout", auth.LogoutHandler(db))

	mux.Handle("GET /api/profile/{id}", auth.RequireAuth(db, profile.GetProfileHandler(db)))

	mux.Handle("PATCH /api/profile/me", auth.RequireAuth(db, profile.UpdateProfileHandler(db)))
	mux.Handle("PATCH /api/profile/me/visibility", auth.RequireAuth(db, profile.UpdateVisibilityHandler(db)))
	mux.Handle("PATCH /api/profile/me/password", auth.RequireAuth(db, profile.UpdatePasswordHandler(db)))
	mux.Handle("POST /api/profile/me/avatar", auth.RequireAuth(db, profile.UploadAvatarHandler(db)))
	mux.Handle("DELETE /api/profile/me/avatar", auth.RequireAuth(db, profile.RemoveAvatarHandler(db)))

	// not final routing (need to finalize http methods)
	mux.Handle("GET /api/users/{id}/follow-status", auth.RequireAuth(db, follow.GetFollowStatusHandler(db)))
	mux.Handle("GET /api/users/{id}/followers", auth.RequireAuth(db, follow.GetFollowersHandler(db)))
	mux.Handle("GET /api/users/{id}/following", auth.RequireAuth(db, follow.GetFollowingHandler(db)))
	mux.Handle("POST /api/users/{id}/follow", auth.RequireAuth(db, follow.SendFollowRequestHandler(db)))
	mux.Handle("DELETE /api/users/{id}/follow", auth.RequireAuth(db, follow.UnfollowHandler(db)))
	mux.Handle("POST /api/follow-requests/{requestId}/accept", auth.RequireAuth(db, follow.AcceptRequestHandler(db)))
	mux.Handle("POST /api/follow-requests/{requestId}/decline", auth.RequireAuth(db, follow.DeclineRequestHandler(db)))
	mux.Handle("DELETE /api/follow-requests/{requestId}", auth.RequireAuth(db, follow.CancelRequestHandler(db)))
	mux.Handle("DELETE /api/followers/{id}", auth.RequireAuth(db, follow.RemoveFollowerHandler(db)))
	mux.Handle("GET /api/follow-requests/pending", auth.RequireAuth(db, follow.GetPendingRequestsHandler(db)))

	// websocket connection endpoint (chat + notifications)
	mux.Handle("GET /ws", auth.RequireAuth(db, ws.UpgradeHandler(hub)))
	mux.Handle("POST /api/chat/{userId}", auth.RequireAuth(db, chat.SendMessageHandler(db, hub)))
	mux.Handle("GET /api/chat/{userId}", auth.RequireAuth(db, chat.GetConversationHandler(db)))
	mux.Handle("POST /api/chat/group/{groupId}", auth.RequireAuth(db, chat.SendGroupMessageHandler(db, hub)))
	mux.Handle("GET /api/chat/group/{groupId}", auth.RequireAuth(db, chat.GetGroupMessagesHandler(db)))
	mux.Handle("GET /api/notifications", auth.RequireAuth(db, notifications.ListNotificationsHandler(db)))
	mux.Handle("PATCH /api/notifications/{id}/read", auth.RequireAuth(db, notifications.MarkReadHandler(db)))
	// groups
	mux.Handle("POST /api/groups", auth.RequireAuth(db, groups.CreateGroupHandler(db)))
	mux.Handle("GET /api/groups", auth.RequireAuth(db, groups.ListBrowsableGroupsHandler(db)))
	mux.Handle("GET /api/groups/{id}", auth.RequireAuth(db, groups.GetGroupHandler(db)))
	mux.Handle("GET /api/groups/{id}/members", auth.RequireAuth(db, groups.ListGroupMembersHandler(db)))
	mux.Handle("DELETE /api/groups/{id}/members/me", auth.RequireAuth(db, groups.LeaveGroupHandler(db)))
	mux.Handle("POST /api/groups/{id}/invites", auth.RequireAuth(db, groups.SendInviteHandler(db)))
	mux.Handle("GET /api/groups/invites", auth.RequireAuth(db, groups.ListMyInvitesHandler(db)))
	mux.Handle("POST /api/invites/{id}/respond", auth.RequireAuth(db, groups.RespondToInviteHandler(db)))
	mux.Handle("POST /api/groups/{id}/join-requests", auth.RequireAuth(db, groups.RequestToJoinHandler(db)))
	mux.Handle("GET /api/groups/{id}/join-requests", auth.RequireAuth(db, groups.ListJoinRequestsHandler(db)))
	mux.Handle("POST /api/groups/{id}/join-requests/{userId}/respond", auth.RequireAuth(db, groups.RespondToJoinRequestHandler(db)))
	mux.Handle("POST /api/groups/{id}/events", auth.RequireAuth(db, groups.CreateEventHandler(db)))
	mux.Handle("GET /api/groups/{id}/events", auth.RequireAuth(db, groups.ListGroupEventsHandler(db)))
	mux.Handle("POST /api/events/{id}/respond", auth.RequireAuth(db, groups.RespondToEventHandler(db)))

	mux.Handle("POST /api/posts", auth.RequireAuth(db, posts.CreatePostHandler(db)))
	mux.Handle("GET /api/posts/{id}", auth.RequireAuth(db, posts.GetPostHandler(db)))
	mux.Handle("PATCH /api/posts/{id}", auth.RequireAuth(db, posts.UpdatePostHandler(db)))
	mux.Handle("DELETE /api/posts/{id}", auth.RequireAuth(db, posts.DeletePostHandler(db)))
	mux.Handle("GET /api/users/{id}/posts", auth.RequireAuth(db, posts.GetUserPostsHandler(db)))
	mux.Handle("GET /api/groups/{id}/posts", auth.RequireAuth(db, posts.GetGroupPostsHandler(db)))
	mux.Handle("GET /api/feed", auth.RequireAuth(db, posts.GetFeedHandler(db)))
	mux.Handle("POST /api/posts/images", auth.RequireAuth(db, posts.UploadPostImageHandler(db)))
	mux.Handle("POST /api/posts/{id}/like", auth.RequireAuth(db, posts.LikePostHandler(db)))
	mux.Handle("DELETE /api/posts/{id}/like", auth.RequireAuth(db, posts.UnlikePostHandler(db)))
	mux.Handle("POST /api/posts/{id}/comments", auth.RequireAuth(db, posts.CreateCommentHandler(db)))
	mux.Handle("GET /api/posts/{id}/comments", auth.RequireAuth(db, posts.GetCommentsHandler(db)))
	mux.Handle("PATCH /api/comments/{id}", auth.RequireAuth(db, posts.UpdateCommentHandler(db)))
	mux.Handle("DELETE /api/comments/{id}", auth.RequireAuth(db, posts.DeleteCommentHandler(db)))
	mux.Handle("POST /api/comments/{id}/like", auth.RequireAuth(db, posts.LikeCommentHandler(db)))
	mux.Handle("DELETE /api/comments/{id}/like", auth.RequireAuth(db, posts.UnlikeCommentHandler(db)))
	mux.Handle("GET /api/images/posts/{filename}", auth.RequireAuth(db, posts.ServePostImageHandler(db)))

	mux.Handle("/uploads/", http.StripPrefix("/uploads/", http.FileServer(http.Dir("./uploads"))))
}
