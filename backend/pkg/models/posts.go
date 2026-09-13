package models

import (
	"database/sql"
	"time"
)

const (
	PrivacyPublic    = "public"
	PrivacyFollowers = "followers"
	PrivacyPrivate   = "private"
)

type Post struct {
	PostID    string         `json:"postId"`
	UserID    string         `json:"userId"`
	GroupID   sql.NullString `json:"-"`
	Content   string         `json:"content"`
	Img       sql.NullString `json:"-"`
	Privacy   string         `json:"privacy"`
	CreatedAt time.Time      `json:"createdAt"`

	AuthorFirstName string         `json:"-"`
	AuthorLastName  string         `json:"-"`
	AuthorAvatar    sql.NullString `json:"-"`
	LikeCount       int64          `json:"-"`
	CommentCount    int64          `json:"-"`
	LikedByViewer   bool           `json:"-"`
}

type PostResponse struct {
	PostID        string    `json:"postId"`
	UserID        string    `json:"userId"`
	GroupID       *string   `json:"groupId,omitempty"`
	Content       string    `json:"content"`
	Img           string    `json:"img,omitempty"`
	Privacy       string    `json:"privacy"`
	CreatedAt     time.Time `json:"createdAt"`
	AuthorName    string    `json:"authorName"`
	AuthorAvatar  string    `json:"authorAvatar,omitempty"`
	LikeCount     int64     `json:"likeCount"`
	CommentCount  int64     `json:"commentCount"`
	LikedByViewer bool      `json:"likedByViewer"`
}

func (p *Post) Sanitize() PostResponse {
	resp := PostResponse{
		PostID:        p.PostID,
		UserID:        p.UserID,
		Content:       p.Content,
		Img:           p.Img.String,
		Privacy:       p.Privacy,
		CreatedAt:     p.CreatedAt,
		AuthorName:    p.AuthorFirstName + " " + p.AuthorLastName,
		AuthorAvatar:  p.AuthorAvatar.String,
		LikeCount:     p.LikeCount,
		CommentCount:  p.CommentCount,
		LikedByViewer: p.LikedByViewer,
	}
	if p.GroupID.Valid {
		resp.GroupID = &p.GroupID.String
	}
	return resp
}

type CreatePostRequest struct {
	Content      string   `json:"content"`
	Img          string   `json:"img,omitempty"`
	Privacy      string   `json:"privacy"`
	GroupID      *string  `json:"groupId,omitempty"`
	VisibleToIDs []string `json:"visibleToIds,omitempty"`
}

type Comment struct {
	CommentID string         `json:"commentId"`
	PostID    string         `json:"postId"`
	UserID    string         `json:"userId"`
	Content   string         `json:"content"`
	Img       sql.NullString `json:"-"`
	CreatedAt time.Time      `json:"createdAt"`

	AuthorFirstName string         `json:"-"`
	AuthorLastName  string         `json:"-"`
	AuthorAvatar    sql.NullString `json:"-"`
	LikeCount       int64          `json:"-"`
	LikedByViewer   bool           `json:"-"`
}

type CommentResponse struct {
	CommentID     string    `json:"commentId"`
	PostID        string    `json:"postId"`
	UserID        string    `json:"userId"`
	Content       string    `json:"content"`
	Img           string    `json:"img,omitempty"`
	CreatedAt     time.Time `json:"createdAt"`
	AuthorName    string    `json:"authorName"`
	AuthorAvatar  string    `json:"authorAvatar,omitempty"`
	LikeCount     int64     `json:"likeCount"`
	LikedByViewer bool      `json:"likedByViewer"`
}

func (c *Comment) Sanitize() CommentResponse {
	return CommentResponse{
		CommentID:     c.CommentID,
		PostID:        c.PostID,
		UserID:        c.UserID,
		Content:       c.Content,
		Img:           c.Img.String,
		CreatedAt:     c.CreatedAt,
		AuthorName:    c.AuthorFirstName + " " + c.AuthorLastName,
		AuthorAvatar:  c.AuthorAvatar.String,
		LikeCount:     c.LikeCount,
		LikedByViewer: c.LikedByViewer,
	}
}

type CreateCommentRequest struct {
	Content string `json:"content"`
	Img     string `json:"img,omitempty"`
}

type UpdatePostRequest struct {
	Content      string   `json:"content,omitempty"`
	Img          *string  `json:"img"`
	Privacy      string   `json:"privacy,omitempty"`
	VisibleToIDs []string `json:"visibleToIds,omitempty"`
}

type UpdateCommentRequest struct {
	Content string  `json:"content,omitempty"`
	Img     *string `json:"img"`
}
