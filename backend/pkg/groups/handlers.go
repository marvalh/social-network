package groups

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"
	"social-network-test/pkg/helpers"
	"social-network-test/pkg/models"
	"social-network-test/pkg/notifications"
	"social-network-test/pkg/ws"

	"github.com/google/uuid"
)

func parseID(raw string) (string, error) {
	if _, err := uuid.Parse(raw); err != nil {
		return "", err
	}
	return raw, nil
}

func CreateGroupHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		var req models.CreateGroupRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}
		if req.Title == "" {
			errors.Handle(w, r, errors.BadRequest("title is required"))
			return
		}

		groupID, err := queries.CreateGroup(db, userID, req.Title, req.Description)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusCreated, map[string]any{"groupId": groupID})
	}
}

func ListBrowsableGroupsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		groups, err := queries.ListBrowsableGroups(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"groups": groups})
	}
}

func SendInviteHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		isMember, err := queries.IsGroupMember(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !isMember {
			errors.Handle(w, r, errors.Forbidden("only members can invite others"))
			return
		}

		var req models.SendInviteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}

		inviteeID, err := parseID(req.InvitedTo)
		if err != nil {
			errors.Handle(w, r, errors.NotFound("user not found"))
			return
		}
		if _, err := queries.GetUserByID(db, inviteeID); err != nil {
			if err == sql.ErrNoRows {
				errors.Handle(w, r, errors.NotFound("user not found"))
			} else {
				errors.Handle(w, r, errors.ErrServerError)
			}
			return
		}

		targetAlreadyMember, err := queries.IsGroupMember(db, groupID, req.InvitedTo)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if targetAlreadyMember {
			errors.Handle(w, r, errors.Conflict("user is already a member"))
			return
		}

		inviteID, err := queries.CreateInvite(db, groupID, userID, req.InvitedTo)
		if err != nil {
			errors.Handle(w, r, err)
			return
		}

		_ = notifications.Create(db, hub, req.InvitedTo, userID, "group_invite", &inviteID)

		helpers.SendJSON(w, http.StatusCreated, map[string]any{"inviteId": inviteID})
	}
}

func ListMyInvitesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		invites, err := queries.ListPendingInvites(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"invites": invites})
	}
}

func RespondToInviteHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		inviteID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid invite id"))
			return
		}

		invite, err := queries.GetInviteByID(db, inviteID)
		if err != nil {
			errors.Handle(w, r, errors.NotFound("invite not found"))
			return
		}
		if invite.InvitedTo != userID {
			errors.Handle(w, r, errors.Forbidden("this invite isn't yours to respond to"))
			return
		}
		if invite.Status != "pending" {
			errors.Handle(w, r, errors.Conflict("invite already responded to"))
			return
		}

		var req models.RespondInviteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}

		if err := queries.RespondToInvite(db, inviteID, req.Accept); err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "responded"})
	}
}

func GetGroupHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		group, err := queries.GetGroupByID(db, groupID, userID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("group not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(group)
	}
}

func ListGroupMembersHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		isMember, err := queries.IsGroupMember(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !isMember {
			errors.Handle(w, r, errors.Forbidden("only members can view the member list"))
			return
		}

		members, err := queries.ListGroupMembers(db, groupID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		helpers.SendJSON(w, http.StatusOK, map[string]any{"members": members})
	}
}

func LeaveGroupHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		if err := queries.LeaveGroup(db, groupID, userID); err != nil {
			errors.Handle(w, r, err)
			return
		}
		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "left"})
	}
}

func RequestToJoinHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		isMember, err := queries.IsGroupMember(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if isMember {
			errors.Handle(w, r, errors.Conflict("already a member"))
			return
		}

		if err := queries.CreateJoinRequest(db, groupID, userID); err != nil {
			errors.Handle(w, r, err)
			return
		}

		if creatorID, err := queries.GetGroupCreatorID(db, groupID); err == nil {
			_ = notifications.Create(db, hub, creatorID, userID, "group_join_request", &groupID)
		}

		helpers.SendJSON(w, http.StatusCreated, map[string]any{"status": "requested"})
	}
}

func ListJoinRequestsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		creatorID, err := queries.GetGroupCreatorID(db, groupID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("group not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if creatorID != userID {
			errors.Handle(w, r, errors.Forbidden("only the creator can view join requests"))
			return
		}

		requests, err := queries.ListPendingJoinRequests(db, groupID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		helpers.SendJSON(w, http.StatusOK, map[string]any{"requests": requests})
	}
}

func RespondToJoinRequestHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}
		requestedBy, err := parseID(r.PathValue("userId"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid user id"))
			return
		}

		creatorID, err := queries.GetGroupCreatorID(db, groupID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("group not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if creatorID != userID {
			errors.Handle(w, r, errors.Forbidden("only the creator can respond to join requests"))
			return
		}

		var req models.RespondInviteRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}

		if err := queries.RespondToJoinRequest(db, groupID, requestedBy, req.Accept); err != nil {
			errors.Handle(w, r, err)
			return
		}
		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "responded"})
	}
}

func CreateEventHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		isMember, err := queries.IsGroupMember(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !isMember {
			errors.Handle(w, r, errors.Forbidden("only members can create events"))
			return
		}

		var req models.CreateEventRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}
		if req.Title == "" || req.EventTime.IsZero() {
			errors.Handle(w, r, errors.BadRequest("title and eventTime are required"))
			return
		}

		eventID, err := queries.CreateEvent(db, groupID, userID, req.Title, req.Description, req.EventTime)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		if members, err := queries.ListGroupMembers(db, groupID); err == nil {
			for _, m := range members {
				if m.UserID == userID {
					continue
				}
				_ = notifications.Create(db, hub, m.UserID, userID, "group_event", &groupID)
			}
		}

		helpers.SendJSON(w, http.StatusCreated, map[string]any{"eventId": eventID})
	}
}

func ListGroupEventsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		isMember, err := queries.IsGroupMember(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !isMember {
			errors.Handle(w, r, errors.Forbidden("only members can view events"))
			return
		}

		events, err := queries.ListGroupEvents(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		helpers.SendJSON(w, http.StatusOK, map[string]any{"events": events})
	}
}

func RespondToEventHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		eventID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid event id"))
			return
		}

		groupID, err := queries.GetEventGroupID(db, eventID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("event not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		isMember, err := queries.IsGroupMember(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !isMember {
			errors.Handle(w, r, errors.Forbidden("only members can RSVP"))
			return
		}

		var req models.RSVPRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			errors.Handle(w, r, errors.ErrInvalidBody)
			return
		}
		if req.Response != "going" && req.Response != "not_going" {
			errors.Handle(w, r, errors.BadRequest("response must be 'going' or 'not_going'"))
			return
		}

		if err := queries.RespondToEvent(db, eventID, userID, req.Response); err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "responded"})
	}
}

func ListMyGroupsHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}

		groups, err := queries.ListMyGroups(db, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		helpers.SendJSON(w, http.StatusOK, map[string]any{"groups": groups})
	}
}

func CancelJoinRequestHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		cancelled, err := queries.CancelJoinRequest(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !cancelled {
			errors.Handle(w, r, errors.NotFound("there is no pending request to cancel"))
			return
		}

		if creatorID, err := queries.GetGroupCreatorID(db, groupID); err == nil {
			_ = queries.DeleteNotification(db, creatorID, userID, "group_join_request", groupID)
			hub.LiveTo([]string{creatorID}, "notifications", "")
		}

		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "cancelled"})
	}
}

func ListGroupInvitesHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		groupID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid group id"))
			return
		}

		isMember, err := queries.IsGroupMember(db, groupID, userID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if !isMember {
			errors.Handle(w, r, errors.Forbidden("only members can see pending invites"))
			return
		}

		invites, err := queries.ListGroupPendingInvites(db, groupID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		helpers.SendJSON(w, http.StatusOK, map[string]any{"invites": invites})
	}
}

func CancelInviteHandler(db *sql.DB, hub *ws.Hub) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userID, ok := auth.GetUserID(r)
		if !ok {
			errors.Handle(w, r, errors.ErrUnauthorized)
			return
		}
		inviteID, err := parseID(r.PathValue("id"))
		if err != nil {
			errors.Handle(w, r, errors.BadRequest("invalid invite id"))
			return
		}

		invite, err := queries.GetInviteByID(db, inviteID)
		if err == sql.ErrNoRows {
			errors.Handle(w, r, errors.NotFound("invite not found"))
			return
		}
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		creatorID, err := queries.GetGroupCreatorID(db, invite.GroupID)
		if err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}
		if invite.InvitedBy != userID && creatorID != userID {
			errors.Handle(w, r, errors.Forbidden("only the person who sent the invite or the group creator can cancel it"))
			return
		}
		if invite.Status != "pending" {
			errors.Handle(w, r, errors.Conflict("invite already responded to"))
			return
		}

		if err := queries.CancelInvite(db, inviteID); err != nil {
			errors.Handle(w, r, errors.ErrServerError)
			return
		}

		_ = queries.DeleteNotification(db, invite.InvitedTo, invite.InvitedBy, "group_invite", inviteID)
		hub.LiveTo([]string{invite.InvitedTo}, "notifications", "")

		helpers.SendJSON(w, http.StatusOK, map[string]any{"status": "cancelled"})
	}
}
