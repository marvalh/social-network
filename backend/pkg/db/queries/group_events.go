package queries

import (
	"database/sql"
	"time"

	"social-network-test/pkg/models"

	"github.com/google/uuid"
)

func CreateEvent(db *sql.DB, groupID, creatorID, title, description string, eventTime time.Time) (string, error) {
	eventID := uuid.NewString()
	_, err := db.Exec(
		`INSERT INTO group_events (event_id, group_id, creator_id, title, event_desc, event_time) VALUES (?, ?, ?, ?, ?, ?)`,
		eventID, groupID, creatorID, title, description, eventTime,
	)
	if err != nil {
		return "", err
	}
	return eventID, nil
}

func GetEventGroupID(db *sql.DB, eventID string) (string, error) {
	var groupID string
	err := db.QueryRow(`SELECT group_id FROM group_events WHERE event_id = ?`, eventID).Scan(&groupID)
	return groupID, err
}

func ListGroupEvents(db *sql.DB, groupID, viewerID string) ([]models.GroupEvent, error) {
	rows, err := db.Query(
		`SELECT e.event_id, e.group_id, e.creator_id, e.title, e.event_desc, e.event_time, e.created_at,
		        (SELECT COUNT(*) FROM event_responses WHERE event_id = e.event_id AND response = 'going') AS going_count,
		        (SELECT COUNT(*) FROM event_responses WHERE event_id = e.event_id AND response = 'not_going') AS not_going_count,
		        COALESCE((SELECT response FROM event_responses WHERE event_id = e.event_id AND user_id = ?), '') AS my_response
		 FROM group_events e
		 WHERE e.group_id = ?
		 ORDER BY e.event_time ASC`,
		viewerID, groupID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	events := []models.GroupEvent{}
	for rows.Next() {
		var ev models.GroupEvent
		var desc sql.NullString
		if err := rows.Scan(&ev.EventID, &ev.GroupID, &ev.CreatorID, &ev.Title, &desc, &ev.EventTime,
			&ev.CreatedAt, &ev.GoingCount, &ev.NotGoingCount, &ev.MyResponse); err != nil {
			return nil, err
		}
		ev.Description = desc.String
		events = append(events, ev)
	}
	return events, rows.Err()
}

func RespondToEvent(db *sql.DB, eventID, userID, response string) error {
	_, err := db.Exec(
		`INSERT OR REPLACE INTO event_responses (event_id, user_id, response) VALUES (?, ?, ?)`,
		eventID, userID, response,
	)
	return err
}