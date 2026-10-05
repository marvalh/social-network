package models

import "time"

type GroupSummary struct {
	GroupID      string    `json:"groupId"`
	CreatorID    string    `json:"creatorId"`
	Title        string    `json:"title"`
	Description  string    `json:"description"`
	CreatedAt    time.Time `json:"createdAt"`
	MemberCount  int       `json:"memberCount"`
	HasRequested bool      `json:"hasRequested"`
}

type CreateGroupRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
}

type GroupInvite struct {
	InviteID  string    `json:"inviteId"`
	GroupID   string    `json:"groupId"`
	InvitedBy string    `json:"invitedBy"`
	InvitedTo string    `json:"invitedTo"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
}

type SendInviteRequest struct {
	InvitedTo string `json:"invitedTo"`
}

type RespondInviteRequest struct {
	Accept bool `json:"accept"`
}

type GroupDetail struct {
	GroupSummary
	IsMember bool `json:"isMember"`
}

type GroupMember struct {
	UserID   string    `json:"userId"`
	JoinedAt time.Time `json:"joinedAt"`
}

type GroupJoinRequest struct {
	GroupID     string    `json:"groupId"`
	RequestedBy string    `json:"requestedBy"`
	Status      string    `json:"status"`
	CreatedAt   time.Time `json:"createdAt"`
}

type GroupEvent struct {
	EventID       string    `json:"eventId"`
	GroupID       string    `json:"groupId"`
	CreatorID     string    `json:"creatorId"`
	Title         string    `json:"title"`
	Description   string    `json:"description"`
	EventTime     time.Time `json:"eventTime"`
	CreatedAt     time.Time `json:"createdAt"`
	GoingCount    int       `json:"goingCount"`
	NotGoingCount int       `json:"notGoingCount"`
	MyResponse    string    `json:"myResponse"`
}

type CreateEventRequest struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	EventTime   time.Time `json:"eventTime"`
}

type RSVPRequest struct {
	Response string `json:"response"`
}
