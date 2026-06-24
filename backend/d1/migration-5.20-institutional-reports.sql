-- Phase 5.20 — Institutional Reports & Analytics Center
CREATE TABLE IF NOT EXISTS report_snapshots (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_report_snapshots_owner_created ON report_snapshots(owner_user_id, created_at);

CREATE TABLE IF NOT EXISTS report_exports (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  report_type TEXT NOT NULL,
  range_key TEXT,
  export_format TEXT DEFAULT 'json',
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_report_exports_owner_created ON report_exports(owner_user_id, created_at);
