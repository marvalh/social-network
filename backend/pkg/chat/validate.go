package chat

import (
	"database/sql"
	"social-network-test/pkg/db/queries"
)

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
