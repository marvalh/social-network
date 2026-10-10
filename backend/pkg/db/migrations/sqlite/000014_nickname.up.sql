UPDATE users SET nickname = NULL
WHERE rowid IN (
  SELECT rowid FROM (
    SELECT rowid,
           ROW_NUMBER() OVER (PARTITION BY nickname COLLATE NOCASE ORDER BY created_at) AS rn
    FROM users
    WHERE nickname IS NOT NULL
  )
  WHERE rn > 1
);

CREATE UNIQUE INDEX idx_users_nickname_unique
  ON users(nickname COLLATE NOCASE)
  WHERE nickname IS NOT NULL;