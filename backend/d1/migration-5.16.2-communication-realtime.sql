-- Phase 5.16.2 — Secure Communication Realtime D1 schema
CREATE TABLE IF NOT EXISTS comm_events (
  id TEXT PRIMARY KEY,
  workspace TEXT NOT NULL,
  key TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  device_id TEXT,
  reason TEXT,
  value_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_comm_events_workspace_created ON comm_events(workspace, created_at);
CREATE INDEX IF NOT EXISTS idx_comm_events_workspace_key_created ON comm_events(workspace, key, created_at);

CREATE TABLE IF NOT EXISTS comm_snapshots (
  workspace TEXT NOT NULL,
  key TEXT NOT NULL,
  value_json TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT,
  device_id TEXT,
  PRIMARY KEY(workspace,key)
);
