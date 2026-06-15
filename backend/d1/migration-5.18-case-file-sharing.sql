-- Phase 5.18 — Secure case file sharing and judicial collaboration
CREATE TABLE IF NOT EXISTS case_file_shares (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  from_user_id TEXT NOT NULL,
  to_user_id TEXT NOT NULL,
  permission TEXT NOT NULL DEFAULT 'read',
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  last_viewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_case_file_shares_file ON case_file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_case_file_shares_to_user ON case_file_shares(to_user_id, status);
CREATE INDEX IF NOT EXISTS idx_case_file_shares_from_user ON case_file_shares(from_user_id, status);

CREATE TABLE IF NOT EXISTS case_file_reviews (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  reviewer_user_id TEXT NOT NULL,
  reviewer_name TEXT,
  review_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_case_file_reviews_file ON case_file_reviews(file_id);
