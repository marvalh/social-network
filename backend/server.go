package main

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"social-network-test/pkg/auth"
	"social-network-test/pkg/db/sqlite"
	"social-network-test/pkg/router"
	"social-network-test/pkg/ws"
)

func main() {
	db, err := sqlite.Setup(".app/data/social_network.db", "pkg/db/migrations/sqlite")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	go cleanupExpiredSessions(db)

	hub := ws.NewHub()

	mux := http.NewServeMux()
	router.RegisterRoutes(mux, db, hub)

	log.Println("Server starting on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}

func cleanupExpiredSessions(db *sql.DB) {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		if err := auth.CleanupExpiredSessions(db); err != nil {
			log.Printf("session cleanup failed: %v", err)
		}
	}
}
