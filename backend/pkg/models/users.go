package models

import (
	"database/sql"
	"time"
)

type User struct {
	UserID    string         `json:"userId"`
	Email     string         `json:"email"`
	Password  string         `json:"-"`
	FirstName string         `json:"firstName"`
	LastName  string         `json:"lastName"`
	DOB       string         `json:"dob"`
	Avatar    sql.NullString `json:"avatar"`
	Nickname  sql.NullString `json:"nickname"`
	AboutMe   sql.NullString `json:"aboutMe"`
	IsPublic  bool           `json:"isPublic"`
	CreatedAt time.Time      `json:"createdAt"`
}

type UserResponse struct {
	UserID    string    `json:"userId"`
	Email     string    `json:"email"`
	FirstName string    `json:"firstName"`
	LastName  string    `json:"lastName"`
	DOB       string    `json:"dob"`
	Avatar    string    `json:"avatar,omitempty"`
	Nickname  string    `json:"nickname,omitempty"`
	AboutMe   string    `json:"aboutMe,omitempty"`
	IsPublic  bool      `json:"isPublic"`
	CreatedAt time.Time `json:"createdAt"`
}

func (u *User) Sanitize() UserResponse {
	return UserResponse{
		UserID:    u.UserID,
		Email:     u.Email,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		DOB:       u.DOB,
		Avatar:    u.Avatar.String,
		Nickname:  u.Nickname.String,
		AboutMe:   u.AboutMe.String,
		IsPublic:  u.IsPublic,
		CreatedAt: u.CreatedAt,
	}
}

// UserPreview is the only shape other people ever see in lists and search
// results. No email, date of birth, bio or join date.
type UserPreview struct {
	UserID    string `json:"userId"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Avatar    string `json:"avatar,omitempty"`
	Nickname  string `json:"nickname,omitempty"`
	IsPublic  bool   `json:"isPublic"`
}

func (u *User) Preview() UserPreview {
	return UserPreview{
		UserID:    u.UserID,
		FirstName: u.FirstName,
		LastName:  u.LastName,
		Avatar:    u.Avatar.String,
		Nickname:  u.Nickname.String,
		IsPublic:  u.IsPublic,
	}
}

type RegisterRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	DOB       string `json:"dob"`
	Avatar    string `json:"avatar,omitempty"`
	Nickname  string `json:"nickname,omitempty"`
	AboutMe   string `json:"aboutMe,omitempty"`
}

type LoginRequest struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
}
