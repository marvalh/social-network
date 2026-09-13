package sqlite

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"
	_ "github.com/mattn/go-sqlite3"
)

//opens connection
func Connect(dbFile string) (*sql.DB, error) {
	conn, err := sql.Open("sqlite3", dbFile+"?_foreign_keys=on")
	if err != nil {
		return nil, fmt.Errorf("sqlite: failed to open %s: %w", dbFile, err)
	}
	conn.SetMaxOpenConns(1)

	if err := conn.Ping(); err != nil {
		return nil, fmt.Errorf("sqlite: connection check failed: %w", err)
	}
	return conn, nil
}

//applies schema changes
func Migrate(conn *sql.DB, dir string) error {
	target, err := sqlite3.WithInstance(conn, &sqlite3.Config{})
	if err != nil {
		return fmt.Errorf("sqlite: could not wrap connection for migrator: %w", err)
	}

	migrator, err := migrate.NewWithDatabaseInstance("file://"+dir, "sqlite3", target)
	if err != nil {
		return fmt.Errorf("sqlite: could not load migrations from %s: %w", dir, err)
	}

	applyErr := migrator.Up()
	if applyErr != nil && applyErr != migrate.ErrNoChange {
		return fmt.Errorf("sqlite: migration failed: %w", applyErr)
	}

	log.Println("sqlite: schema is up to date")
	return nil
}

//handles both functions together 
func Setup(dbFile, migrationsDir string) (*sql.DB, error) {
	conn, err := Connect(dbFile)
	if err != nil {
		return nil, err
	}

	if err := Migrate(conn, migrationsDir); err != nil {
		conn.Close()
		return nil, err
	}

	return conn, nil
}