-- Phase 5.24 — Advanced Platform Settings Center
CREATE TABLE IF NOT EXISTS platform_settings (
  scope TEXT PRIMARY KEY,
  settings_json TEXT NOT NULL DEFAULT '{}',
  updated_at TEXT NOT NULL,
  updated_by TEXT
);

CREATE TABLE IF NOT EXISTS platform_settings_audit (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL DEFAULT 'global',
  action TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_audit_scope_date
ON platform_settings_audit(scope, created_at DESC);
