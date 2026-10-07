package chat

import (
	"database/sql"
	"strings"
	"unicode/utf8"

	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/errors"
)

const maxMessageLen = 1000

// cleanMessage trims the text and enforces the length rules.
func cleanMessage(content string) (string, *errors.Error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return "", errors.BadRequest("Message can't be empty")
	}
	if utf8.RuneCountInString(content) > maxMessageLen {
		return "", errors.BadRequest("Message is too long (max 1000 characters)")
	}
	return content, nil
}

func canMessage(db *sql.DB, userA, userB string) (bool, error) {
	aFollowsB, err1 := queries.IsFollowing(db, userA, userB)
	if err1 != nil {
		return false, err1
	}
	bFollowsA, err2 := queries.IsFollowing(db, userB, userA)
	if err2 != nil {
		return false, err2
	}

	return aFollowsB || bFollowsA, nil
}
