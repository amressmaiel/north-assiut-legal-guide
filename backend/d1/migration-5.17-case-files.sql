-- Phase 5.17 — Case files smart storage schema for Cloudflare D1
CREATE TABLE IF NOT EXISTS case_files (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  case_number TEXT,
  case_year TEXT,
  prosecution_name TEXT,
  incident_type TEXT,
  status TEXT NOT NULL DEFAULT 'studying',
  priority TEXT NOT NULL DEFAULT 'normal',
  facts_summary TEXT,
  original_facts TEXT,
  closest_charge TEXT,
  archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_case_files_owner_updated ON case_files(owner_user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_files_status ON case_files(owner_user_id, status, archived);

CREATE TABLE IF NOT EXISTS case_file_sections (
  id TEXT PRIMARY KEY,
  case_file_id TEXT NOT NULL,
  section_type TEXT NOT NULL,
  section_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(case_file_id) REFERENCES case_files(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_case_file_sections_file ON case_file_sections(case_file_id, section_type);

CREATE TABLE IF NOT EXISTS case_file_activity (
  id TEXT PRIMARY KEY,
  case_file_id TEXT NOT NULL,
  actor_user_id TEXT,
  activity_text TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(case_file_id) REFERENCES case_files(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_case_file_activity_file ON case_file_activity(case_file_id, created_at DESC);

CREATE TABLE IF NOT EXISTS case_file_attachments (
  id TEXT PRIMARY KEY,
  case_file_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_key TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(case_file_id) REFERENCES case_files(id) ON DELETE CASCADE
);
