-- Cloudflare D1 schema draft for SAND Legal Guide Auth / License system
-- Phase 5.5.0 design draft - not yet executed automatically

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  level INTEGER NOT NULL DEFAULT 10,
  description TEXT,
  is_system INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL,
  name_en TEXT,
  module TEXT NOT NULL,
  category TEXT,
  description TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  allowed INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  phone TEXT,
  full_name TEXT NOT NULL,
  job_title TEXT,
  organization TEXT,
  password_hash TEXT NOT NULL,
  role_id INTEGER NOT NULL,
  account_status TEXT NOT NULL DEFAULT 'pending_activation',
  is_active INTEGER NOT NULL DEFAULT 1,
  is_system_owner INTEGER NOT NULL DEFAULT 0,
  valid_from TEXT,
  valid_until TEXT,
  provisional_until TEXT,
  final_license_id TEXT,
  final_license_revision INTEGER DEFAULT 0,
  final_license_valid_from TEXT,
  final_license_valid_until TEXT,
  final_permissions_json TEXT DEFAULT '[]',
  device_policy_mode TEXT NOT NULL DEFAULT 'limited',
  max_devices INTEGER NOT NULL DEFAULT 1,
  must_change_password INTEGER NOT NULL DEFAULT 1,
  failed_login_count INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  auth_version INTEGER NOT NULL DEFAULT 1,
  last_login_at TEXT,
  created_by INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (role_id) REFERENCES roles(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS active_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  token_hash TEXT,
  device_fingerprint_hash TEXT,
  device_name TEXT,
  platform TEXT,
  ip_hash TEXT,
  user_agent_hash TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  revoked_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_fingerprint_hash TEXT NOT NULL,
  device_label TEXT,
  platform TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  suspended_at TEXT,
  suspended_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, device_fingerprint_hash)
);

CREATE TABLE IF NOT EXISTS licenses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  license_id TEXT NOT NULL UNIQUE,
  license_type TEXT NOT NULL,
  issued_to TEXT,
  organization TEXT,
  tenant_id TEXT,
  user_id INTEGER,
  role_code TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  valid_from TEXT,
  valid_until TEXT,
  license_revision INTEGER NOT NULL DEFAULT 1,
  features_json TEXT DEFAULT '{}',
  permissions_json TEXT DEFAULT '[]',
  device_policy_json TEXT DEFAULT '{}',
  payload_json TEXT NOT NULL,
  signature_base64 TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  imported_by INTEGER,
  imported_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TEXT,
  revoked_reason TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (imported_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS revoked_license_cache (
  license_id TEXT PRIMARY KEY,
  reason TEXT,
  revoked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  source TEXT
);

CREATE TABLE IF NOT EXISTS bootstrap_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  request_no TEXT NOT NULL UNIQUE,
  request_type TEXT NOT NULL,
  product_id TEXT NOT NULL,
  tenant_id TEXT,
  installation_id TEXT,
  server_fingerprint_hash TEXT NOT NULL,
  device_fingerprint_hash TEXT,
  device_name TEXT,
  platform TEXT,
  app_version TEXT,
  nonce TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  exported_at TEXT,
  completed_at TEXT,
  bootstrap_grant_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS used_bootstrap_grants (
  bootstrap_grant_id TEXT PRIMARY KEY,
  request_no TEXT NOT NULL,
  bootstrap_type TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  server_fingerprint_hash TEXT NOT NULL,
  used_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  ip_hash TEXT,
  user_agent_hash TEXT,
  details_json TEXT DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  type TEXT NOT NULL DEFAULT 'string',
  group_name TEXT,
  updated_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(account_status, is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON active_sessions(user_id, expires_at);
CREATE INDEX IF NOT EXISTS idx_devices_user ON user_devices(user_id, status);
CREATE INDEX IF NOT EXISTS idx_audit_user_date ON audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action_date ON audit_logs(action, created_at);
