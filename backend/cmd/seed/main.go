// Seeds the database with 10 dummy users, follow relationships, posts
// (every privacy level), two groups with members/invites/events, and
// a few chat messages — enough to exercise every feature end to end
// without registering accounts by hand or shipping a prebuilt .db file.
//
// This inserts through the app's own query functions at `go run` time,
// so it works against any fresh database right after migrations run,
// instead of depending on a specific binary .db file you'd have to keep
// in sync with your schema.
//
// Run from backend/:
//   go run ./cmd/seed
//
// Safe to re-run: user/group creation is skipped (not duplicated) if it
// already exists; posts/messages are cheap inserts and will duplicate on
// a second run, so run this once against a fresh database.
package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/queries"
	"social-network-test/pkg/db/sqlite"
	"social-network-test/pkg/models"
)

// All dummy users share this password so you can log in as any of them.
const dummyPassword = "Password123!"

type seedUser struct {
	email, first, last, dob, nickname, aboutMe string
	isPublic                                   bool
}

var dummyUsers = []seedUser{
	{"ava.martin@example.com", "Ava", "Martin", "1998-03-12", "ava_m", "Coffee first, code second.", true},
	{"liam.chen@example.com", "Liam", "Chen", "1995-07-23", "liamc", "Into hiking and Go backends.", true},
	{"noor.hassan@example.com", "Noor", "Hassan", "2000-01-05", "noorh", "", false},
	{"ethan.brooks@example.com", "Ethan", "Brooks", "1997-11-30", "", "Photographer on weekends.", true},
	{"mia.rossi@example.com", "Mia", "Rossi", "1999-06-18", "mia_r", "Studying design, posting sketches.", false},
	{"omar.khalid@example.com", "Omar", "Khalid", "1996-09-09", "omark", "", true},
	{"sophia.lee@example.com", "Sophia", "Lee", "2001-04-27", "sophial", "Frontend dev, cat owner.", true},
	{"jack.wilson@example.com", "Jack", "Wilson", "1994-12-02", "", "", false},
	{"zara.ahmed@example.com", "Zara", "Ahmed", "1998-08-14", "zara_a", "Traveling and writing about it.", true},
	{"ben.foster@example.com", "Ben", "Foster", "1993-02-21", "benf", "Gym, games, and Go routines.", true},
}

func main() {
	db, err := sqlite.Setup("./data/social_network.db", "pkg/db/migrations/sqlite")
	if err != nil {
		log.Fatalf("seed: db setup failed: %v", err)
	}
	defer db.Close()

	hashed, err := auth.HashPassword(dummyPassword)
	if err != nil {
		log.Fatalf("seed: hash failed: %v", err)
	}

	// ids is always fully populated (len == len(dummyUsers)), whether a
	// user was just created or already existed from a previous run —
	// so follow-seeding below can safely index into it either way.
	ids := make([]string, len(dummyUsers))
	for i, su := range dummyUsers {
		existing, err := queries.GetUserByEmail(db, su.email)
		if err != nil && err != sql.ErrNoRows {
			log.Fatalf("seed: email lookup failed for %s: %v", su.email, err)
		}
		if existing != nil {
			fmt.Printf("skip (already exists): %s\n", su.email)
			ids[i] = existing.UserID
			continue
		}

		u := models.User{
			Email:     su.email,
			Password:  hashed,
			FirstName: su.first,
			LastName:  su.last,
			DOB:       su.dob,
		}
		if su.nickname != "" {
			u.Nickname.String, u.Nickname.Valid = su.nickname, true
		}
		if su.aboutMe != "" {
			u.AboutMe.String, u.AboutMe.Valid = su.aboutMe, true
		}

		id, err := queries.CreateUser(db, u)
		if err != nil {
			log.Fatalf("seed: create user %s failed: %v", su.email, err)
		}
		if err := queries.SetProfileVisibility(db, id, su.isPublic); err != nil {
			log.Fatalf("seed: set visibility for %s failed: %v", su.email, err)
		}

		ids[i] = id
		fmt.Printf("created: %s (%s)\n", su.email, id)
	}

	seedFollow(db, ids[0], ids[1], "accepted") // Ava -> Liam
	seedFollow(db, ids[1], ids[0], "accepted") // Liam -> Ava (mutual)
	seedFollow(db, ids[2], ids[1], "pending")  // Noor -> Liam (pending)
	seedFollow(db, ids[3], ids[0], "accepted") // Ethan -> Ava
	seedFollow(db, ids[4], ids[0], "pending")  // Mia -> Ava (pending, Mia's private too)
	seedFollow(db, ids[5], ids[6], "accepted") // Omar -> Sophia
	seedFollow(db, ids[6], ids[5], "pending")  // Sophia -> Omar (pending)
	seedFollow(db, ids[7], ids[8], "accepted") // Jack -> Zara
	seedFollow(db, ids[9], ids[0], "accepted") // Ben -> Ava

	seedPosts(db, ids)
	seedGroups(db, ids)
	seedChat(db, ids)

	fmt.Println("done.")
	fmt.Printf("all dummy users share the password: %s\n", dummyPassword)
}

//seedPosts contains all diff privacy levels
func seedPosts(db *sql.DB, ids []string) {
	ava, liam, noor, ethan, mia, omar, sophia := ids[0], ids[1], ids[2], ids[3], ids[4], ids[5], ids[6]

	createPost := func(authorID, content, privacy string, visibleTo []string) string {
		postID, err := queries.CreatePost(db, authorID, models.CreatePostRequest{
			Content: content,
			Privacy: privacy,
		})
		if err != nil {
			log.Printf("seed: create post for %s failed: %v", authorID, err)
			return ""
		}
		if privacy == models.PrivacyPrivate && len(visibleTo) > 0 {
			if err := queries.AddPostVisibility(db, postID, visibleTo); err != nil {
				log.Printf("seed: set visibility for post %s failed: %v", postID, err)
			}
		}
		return postID
	}

	p1 := createPost(ava, "First day back from the mountains, already planning the next trip.", models.PrivacyPublic, nil)
	createPost(ava, "Followers-only update: finally fixed that bug that's been haunting me all week.", models.PrivacyFollowers, nil)
	createPost(ava, "Private note to a couple of friends about Saturday.", models.PrivacyPrivate, []string{liam, ethan})

	p2 := createPost(liam, "Pushed a big refactor today, feels good.", models.PrivacyPublic, nil)
	createPost(liam, "Followers only: looking for hiking buddies this weekend.", models.PrivacyFollowers, nil)

	createPost(noor, "New sketch, feedback welcome.", models.PrivacyPublic, nil)
	createPost(ethan, "Shot this at golden hour yesterday.", models.PrivacyPublic, nil)
	createPost(mia, "Private thoughts on my latest project, only for close friends.", models.PrivacyPrivate, []string{ava})
	createPost(omar, "Gym PR today, small wins.", models.PrivacyPublic, nil)
	createPost(sophia, "Cat refuses to let me work. Send help.", models.PrivacyPublic, nil)

	// likes+comments
	if p1 != "" {
		if _, err := queries.CreateComment(db, p1, liam, models.CreateCommentRequest{Content: "Looks amazing, take me next time!"}); err != nil {
			log.Printf("seed: comment on %s failed: %v", p1, err)
		}
		if err := queries.LikePost(db, p1, liam); err != nil {
			log.Printf("seed: like %s failed: %v", p1, err)
		}
		if err := queries.LikePost(db, p1, ethan); err != nil {
			log.Printf("seed: like %s failed: %v", p1, err)
		}
	}
	if p2 != "" {
		if _, err := queries.CreateComment(db, p2, ava, models.CreateCommentRequest{Content: "Nice, what did you refactor?"}); err != nil {
			log.Printf("seed: comment on %s failed: %v", p2, err)
		}
		if err := queries.LikePost(db, p2, ava); err != nil {
			log.Printf("seed: like %s failed: %v", p2, err)
		}
	}
}

func seedGroups(db *sql.DB, ids []string) {
	ava, liam, noor, ethan, mia, omar, sophia, jack := ids[0], ids[1], ids[2], ids[3], ids[4], ids[5], ids[6], ids[7]

	hikingGroupID, err := findOrCreateGroup(db, ava, "Weekend Hikers", "Planning hikes and sharing trail photos.")
	if err != nil {
		log.Printf("seed: create group Weekend Hikers failed: %v", err)
		return
	}
	devGroupID, err := findOrCreateGroup(db, sophia, "Frontend Devs", "Talking shop about React, CSS, and everything in between.")
	if err != nil {
		log.Printf("seed: create group Frontend Devs failed: %v", err)
		return
	}

	// Members already in Weekend Hikers: invite + accept Liam and Ethan.
	for _, memberID := range []string{liam, ethan} {
		addGroupMember(db, hikingGroupID, ava, memberID)
	}
	// Noor invited but hasn't responded yet — leave as a pending invite.
	if _, err := queries.CreateInvite(db, hikingGroupID, ava, noor); err != nil {
		log.Printf("seed: invite Noor to hiking group failed: %v", err)
	}
	// Mia asks to join — a pending join request for Ava (the creator) to act on.
	if err := queries.CreateJoinRequest(db, hikingGroupID, mia); err != nil {
		log.Printf("seed: join request from Mia failed: %v", err)
	}

	// Members already in Frontend Devs.
	for _, memberID := range []string{omar, jack} {
		addGroupMember(db, devGroupID, sophia, memberID)
	}

	// An event in each group, with a couple of RSVPs.
	hikeTime := time.Now().Add(5 * 24 * time.Hour)
	hikeEventID, err := queries.CreateEvent(db, hikingGroupID, ava, "Saturday Trail Hike", "Meet at the trailhead at 9am, bring water.", hikeTime)
	if err != nil {
		log.Printf("seed: create hike event failed: %v", err)
	} else {
		queries.RespondToEvent(db, hikeEventID, liam, "going")
		queries.RespondToEvent(db, hikeEventID, ethan, "not_going")
	}

	meetupTime := time.Now().Add(10 * 24 * time.Hour)
	meetupEventID, err := queries.CreateEvent(db, devGroupID, sophia, "Monthly Frontend Meetup", "Show and tell — bring a project you're proud of.", meetupTime)
	if err != nil {
		log.Printf("seed: create meetup event failed: %v", err)
	} else {
		queries.RespondToEvent(db, meetupEventID, omar, "going")
	}

	// One post inside each group so the group feed isn't empty.
	if _, err := queries.CreatePost(db, ava, models.CreatePostRequest{
		Content: "Trail conditions look great this week, see you all Saturday!",
		Privacy: models.PrivacyPublic,
		GroupID: &hikingGroupID,
	}); err != nil {
		log.Printf("seed: group post in hiking group failed: %v", err)
	}

	// A couple of group chat messages.
	if _, err := queries.InsertGroupMessage(db, hikingGroupID, liam, "Can't wait for Saturday!"); err != nil {
		log.Printf("seed: group message failed: %v", err)
	}
	if _, err := queries.InsertGroupMessage(db, hikingGroupID, ava, "Same! Weather looks perfect."); err != nil {
		log.Printf("seed: group message failed: %v", err)
	}
}

// findOrCreateGroup avoids creating duplicate group with the same title on a re-run
func findOrCreateGroup(db *sql.DB, creatorID, title, description string) (string, error) {
	var groupID string
	err := db.QueryRow(
		`SELECT group_id FROM groups WHERE creator_id = ? AND title = ?`,
		creatorID, title,
	).Scan(&groupID)
	if err == nil {
		return groupID, nil
	}
	if err != sql.ErrNoRows {
		return "", err
	}
	return queries.CreateGroup(db, creatorID, title, description)
}

// addGroupMember invites memberID to groupID on invitedBy's behalf and
// immediately accepts on their behalf, skipping quietly if they're
// already a member (e.g. on a re-run).
func addGroupMember(db *sql.DB, groupID, invitedBy, memberID string) {
	alreadyIn, err := queries.IsGroupMember(db, groupID, memberID)
	if err != nil {
		log.Printf("seed: membership check failed: %v", err)
		return
	}
	if alreadyIn {
		return
	}
	inviteID, err := queries.CreateInvite(db, groupID, invitedBy, memberID)
	if err != nil {
		log.Printf("seed: invite %s to group %s failed: %v", memberID, groupID, err)
		return
	}
	if err := queries.RespondToInvite(db, inviteID, true); err != nil {
		log.Printf("seed: accept invite for %s failed: %v", memberID, err)
	}
}

// seedChat adds a short direct-message conversation and a group message
// so the chat UI has something to render.
func seedChat(db *sql.DB, ids []string) {
	ava, liam := ids[0], ids[1]

	if _, err := queries.InsertMessage(db, ava, liam, "Hey! Are you free for a hike this weekend?"); err != nil {
		log.Printf("seed: direct message failed: %v", err)
		return
	}
	if _, err := queries.InsertMessage(db, liam, ava, "Yes! Count me in 🙌"); err != nil {
		log.Printf("seed: direct message failed: %v", err)
	}
}

func seedFollow(db *sql.DB, followerID, followeeID, status string) {
	created, err := queries.UpsertFollowRequest(db, followerID, followeeID, status)
	if err != nil {
		log.Printf("seed: follow %s -> %s failed: %v", followerID, followeeID, err)
		return
	}
	if !created {
		log.Printf("seed: follow %s -> %s skipped (already exists)", followerID, followeeID)
	}
}