-- Internship records schema (SQLite)
CREATE TABLE IF NOT EXISTS internships (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  title           TEXT    NOT NULL CHECK (length(trim(title)) >= 3),
  company         TEXT    NOT NULL CHECK (length(trim(company)) >= 2),
  location        TEXT    NOT NULL,
  mode            TEXT    NOT NULL CHECK (mode IN ('remote', 'onsite', 'hybrid')),
  stipend         INTEGER NOT NULL DEFAULT 0 CHECK (stipend >= 0),
  duration_weeks  INTEGER NOT NULL DEFAULT 8 CHECK (duration_weeks BETWEEN 1 AND 52),
  status          TEXT    NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  deadline        TEXT,                       -- ISO date: YYYY-MM-DD
  description     TEXT    NOT NULL DEFAULT '',
  created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_internships_status ON internships (status);
CREATE INDEX IF NOT EXISTS idx_internships_mode   ON internships (mode);
