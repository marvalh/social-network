package queries

import (
	"database/sql"
	"social-network-test/pkg/errors"
	"social-network-test/pkg/models"

	"github.com/google/uuid"
)

func IsGroupMember(db *sql.DB, groupID, userID string) (bool, error) {
	var exists bool
	err := db.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM group_members WHERE group_id = ? AND members_id = ?)`,
		groupID, userID,
	).Scan(&exists)
	return exists, err
}

func CreateGroup(db *sql.DB, creatorID, title, description string) (string, error) {
	groupID := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO groups (group_id, creator_id, title, grp_desc) VALUES (?, ?, ?, ?)`,
		groupID, creatorID, title, description,
	)
	if err != nil {
		return "", err
	}

	if _, err := db.Exec(
		`INSERT INTO group_members (group_id, members_id) VALUES (?, ?)`,
		groupID, creatorID,
	); err != nil {
		return "", err
	}

	return groupID, nil
}

func ListBrowsableGroups(db *sql.DB, viewerID string) ([]models.GroupSummary, error) {
	rows, err := db.Query(
		`SELECT g.group_id, g.creator_id, g.title, g.grp_desc, g.created_at,
		        COUNT(gm.members_id) AS member_count
		 FROM groups g
		 LEFT JOIN group_members gm ON gm.group_id = g.group_id
		 WHERE g.group_id NOT IN (
		     SELECT group_id FROM group_members WHERE members_id = ?
		 )
		 GROUP BY g.group_id
		 ORDER BY g.created_at DESC`,
		viewerID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	groups := []models.GroupSummary{}
	for rows.Next() {
		var g models.GroupSummary
		if err := rows.Scan(&g.GroupID, &g.CreatorID, &g.Title, &g.Description, &g.CreatedAt, &g.MemberCount); err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, rows.Err()
}

func CreateInvite(db *sql.DB, groupID, invitedBy, invitedTo string) (string, error) {
	var alreadyPending bool
	err := db.QueryRow(
		`SELECT EXISTS(
		     SELECT 1 FROM group_invite
		     WHERE group_id = ? AND invited_to = ? AND status = 'pending'
		 )`,
		groupID, invitedTo,
	).Scan(&alreadyPending)
	if err != nil {
		return "", err
	}
	if alreadyPending {
		return "", errors.Conflict("an invite is already pending for this user")
	}

	inviteID := uuid.NewString()
	_, err = db.Exec(
		`INSERT INTO group_invite (id, group_id, invited_by, invited_to) VALUES (?, ?, ?, ?)`,
		inviteID, groupID, invitedBy, invitedTo,
	)
	if err != nil {
		return "", err
	}
	return inviteID, nil
}

func GetInviteByID(db *sql.DB, inviteID string) (*models.GroupInvite, error) {
	var inv models.GroupInvite
	err := db.QueryRow(
		`SELECT id, group_id, invited_by, invited_to, status, created_at
		 FROM group_invite WHERE id = ?`,
		inviteID,
	).Scan(&inv.InviteID, &inv.GroupID, &inv.InvitedBy, &inv.InvitedTo, &inv.Status, &inv.CreatedAt)
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func ListPendingInvites(db *sql.DB, userID string) ([]models.GroupInvite, error) {
	rows, err := db.Query(
		`SELECT id, group_id, invited_by, invited_to, status, created_at
		 FROM group_invite
		 WHERE invited_to = ? AND status = 'pending'
		 ORDER BY created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	invites := []models.GroupInvite{}
	for rows.Next() {
		var inv models.GroupInvite
		if err := rows.Scan(&inv.InviteID, &inv.GroupID, &inv.InvitedBy, &inv.InvitedTo, &inv.Status, &inv.CreatedAt); err != nil {
			return nil, err
		}
		invites = append(invites, inv)
	}
	return invites, rows.Err()
}

func RespondToInvite(db *sql.DB, inviteID string, accept bool) error {
	status := "declined"
	if accept {
		status = "accepted"
	}

	inv, err := GetInviteByID(db, inviteID)
	if err != nil {
		return err
	}

	if _, err := db.Exec(
		`UPDATE group_invite SET status = ? WHERE id = ?`,
		status, inviteID,
	); err != nil {
		return err
	}

	if accept {
		if _, err := db.Exec(
			`INSERT INTO group_members (group_id, members_id) VALUES (?, ?)`,
			inv.GroupID, inv.InvitedTo,
		); err != nil {
			return err
		}
	}
	return nil
}

func GetGroupByID(db *sql.DB, groupID, viewerID string) (*models.GroupDetail, error) {
	var g models.GroupDetail
	err := db.QueryRow(
		`SELECT g.group_id, g.creator_id, g.title, g.grp_desc, g.created_at,
		        (SELECT COUNT(*) FROM group_members WHERE group_id = g.group_id) AS member_count,
		        EXISTS(SELECT 1 FROM group_members WHERE group_id = g.group_id AND members_id = ?) AS is_member
		 FROM groups g WHERE g.group_id = ?`,
		viewerID, groupID,
	).Scan(&g.GroupID, &g.CreatorID, &g.Title, &g.Description, &g.CreatedAt, &g.MemberCount, &g.IsMember)
	if err != nil {
		return nil, err
	}
	return &g, nil
}

func GetGroupCreatorID(db *sql.DB, groupID string) (string, error) {
	var creatorID string
	err := db.QueryRow(`SELECT creator_id FROM groups WHERE group_id = ?`, groupID).Scan(&creatorID)
	return creatorID, err
}

func ListGroupMembers(db *sql.DB, groupID string) ([]models.GroupMember, error) {
	rows, err := db.Query(
		`SELECT members_id, joined_at FROM group_members WHERE group_id = ? ORDER BY joined_at ASC`,
		groupID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	members := []models.GroupMember{}
	for rows.Next() {
		var m models.GroupMember
		if err := rows.Scan(&m.UserID, &m.JoinedAt); err != nil {
			return nil, err
		}
		members = append(members, m)
	}
	return members, rows.Err()
}

func LeaveGroup(db *sql.DB, groupID, userID string) error {
	creatorID, err := GetGroupCreatorID(db, groupID)
	if err == sql.ErrNoRows {
		return errors.NotFound("group not found")
	}
	if err != nil {
		return err
	}
	if creatorID == userID {
		return errors.Forbidden("the creator can't leave their own group")
	}
	_, err = db.Exec(`DELETE FROM group_members WHERE group_id = ? AND members_id = ?`, groupID, userID)
	return err
}

func CreateJoinRequest(db *sql.DB, groupID, requestedBy string) error {
	var existingStatus string
	err := db.QueryRow(
		`SELECT status FROM group_join_request WHERE group_id = ? AND requested_by = ?`,
		groupID, requestedBy,
	).Scan(&existingStatus)
	if err != nil && err != sql.ErrNoRows {
		return err
	}
	if err == nil && existingStatus == "pending" {
		return errors.Conflict("join request already pending")
	}

	_, err = db.Exec(
		`INSERT OR REPLACE INTO group_join_request (group_id, requested_by, status) VALUES (?, ?, 'pending')`,
		groupID, requestedBy,
	)
	return err
}

func ListPendingJoinRequests(db *sql.DB, groupID string) ([]models.GroupJoinRequest, error) {
	rows, err := db.Query(
		`SELECT group_id, requested_by, status, created_at
		 FROM group_join_request WHERE group_id = ? AND status = 'pending'
		 ORDER BY created_at ASC`,
		groupID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := []models.GroupJoinRequest{}
	for rows.Next() {
		var jr models.GroupJoinRequest
		if err := rows.Scan(&jr.GroupID, &jr.RequestedBy, &jr.Status, &jr.CreatedAt); err != nil {
			return nil, err
		}
		requests = append(requests, jr)
	}
	return requests, rows.Err()
}

func RespondToJoinRequest(db *sql.DB, groupID, requestedBy string, accept bool) error {
	status := "declined"
	if accept {
		status = "accepted"
	}
	if _, err := db.Exec(
		`UPDATE group_join_request SET status = ? WHERE group_id = ? AND requested_by = ?`,
		status, groupID, requestedBy,
	); err != nil {
		return err
	}
	if accept {
		if _, err := db.Exec(
			`INSERT INTO group_members (group_id, members_id) VALUES (?, ?)`,
			groupID, requestedBy,
		); err != nil {
			return err
		}
	}
	return nil
}

func ListMyGroups(db *sql.DB, userID string) ([]models.GroupSummary, error) {
	rows, err := db.Query(
		`SELECT g.group_id, g.creator_id, g.title, g.grp_desc, g.created_at,
		        (SELECT COUNT(*) FROM group_members WHERE group_id = g.group_id) AS member_count
		 FROM groups g
		 JOIN group_members gm ON gm.group_id = g.group_id AND gm.members_id = ?
		 ORDER BY g.created_at DESC`,
		userID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	groups := []models.GroupSummary{}
	for rows.Next() {
		var g models.GroupSummary
		if err := rows.Scan(&g.GroupID, &g.CreatorID, &g.Title, &g.Description, &g.CreatedAt, &g.MemberCount); err != nil {
			return nil, err
		}
		groups = append(groups, g)
	}
	return groups, rows.Err()
}