package models

import "time"

type PostSummary struct {
	PostID    string    `json:"postId"`
	Content   string    `json:"content"`
	Img       string    `json:"img,omitempty"`
	Privacy   string    `json:"privacy"`
	CreatedAt time.Time `json:"createdAt"`
}

type ProfileResponse struct {
	User           UserResponse   `json:"user"`
	IsOwner        bool           `json:"isOwner"`
	CanView        bool           `json:"canView"`
	FollowStatus   string         `json:"followStatus"` // "self" | "none" | "pending" | "accepted"
	IsFollowing    bool           `json:"isFollowing"`
	FollowerCount  int            `json:"followerCount"`
	FollowingCount int            `json:"followingCount"`
	Followers      []UserResponse `json:"followers,omitempty"`
	Following      []UserResponse `json:"following,omitempty"`
	Posts          []PostSummary  `json:"posts,omitempty"`
}

type UpdateProfileRequest struct {
	FirstName *string `json:"firstName,omitempty"`
	LastName  *string `json:"lastName,omitempty"`
	Nickname  *string `json:"nickname,omitempty"`
	AboutMe   *string `json:"aboutMe,omitempty"`
}

type UpdateVisibilityRequest struct {
	IsPublic bool `json:"isPublic"`
}

type UpdatePasswordRequest struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
}
