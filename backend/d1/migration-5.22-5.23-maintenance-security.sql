-- Phase 5.22 + 5.23 — Maintenance and Security Audit schema foundation
CREATE TABLE IF NOT EXISTS performance_maintenance_runs (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  created_by TEXT,
  total_keys INTEGER DEFAULT 0,
  total_bytes INTEGER DEFAULT 0,
  temp_keys INTEGER DEFAULT 0,
  large_keys INTEGER DEFAULT 0,
  score INTEGER DEFAULT 0,
  report_json TEXT
);

CREATE TABLE IF NOT EXISTS security_hardening_reviews (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  created_by TEXT,
  readiness_score INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  report_json TEXT
);

CREATE TABLE IF NOT EXISTS security_review_items (
  id TEXT PRIMARY KEY,
  review_id TEXT NOT NULL,
  check_id TEXT NOT NULL,
  category TEXT,
  title TEXT,
  risk TEXT,
  ok INTEGER DEFAULT 0,
  reviewed_by TEXT,
  reviewed_at TEXT,
  note TEXT
);
